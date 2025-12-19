# راهنمای جامع راه‌اندازی سیستم انبار

## مقدمه

این سند راهنمای کامل برای نصب و راه‌اندازی برنامه سیستم مدیریت انبار بر روی سرور Ubuntu است. برنامه یک اپلیکیشن React تمام‌ جریان است که از Firebase Realtime Database برای ذخیره‌سازی داده‌ها استفاده می‌کند و از طریق Nginx به عنوان وب‌سرور سرو می‌شود.

---

## اطلاعات سرور

| مورد | جزئیات |
|------|--------|
| **IP سرور** | `Your_Server_IP` |
| **سیستم‌عامل** | Ubuntu |
| **ساب‌دامنه** | `YOUR_DOMAIN` |
| **وب‌سرور** | Nginx |
| **پورت** | 80 (HTTP) |
| **مسیر فولدر** | `/var/www/warehouse-app` |

---

## مرحله 1: آمادگی سرور

### ۱.۱ بروزرسانی سیستم

```bash
ssh root@Your_Server_IP
apt update
apt upgrade -y
```

### ۱.۲ ایجاد فولدر پروژه

```bash
sudo mkdir -p /var/www/warehouse-app
cd /var/www/warehouse-app
```

### ۱.۳ انتقال فایل‌های پروژه

فایل `warehouse-app.zip` را از طریق SCP به سرور کپی کنید:

```bash
# روی کامپیوتر محلی خود:
scp -r dist/ root@Your_Server_IP:/var/www/warehouse-app/dist
```

یا اگر فایل‌های منبع را دارید:

```bash
unzip warehouse-app.zip
cd warehouse-app
npm install
npm run build
```

---

## مرحله 2: نصب و تنظیم Node.js و NPM

### ۲.۱ نصب npm

```bash
apt install -y npm
apt install -y nodejs
```

### ۲.۲ بررسی نسخه

```bash
node --version
npm --version
```

### ۲.۳ نصب وابستگی‌ها و Build

اگر هنوز build نکرده‌اید:

```bash
cd /var/www/warehouse-app
npm install
npm run build
```

پس از این دستور، پوشه `dist` شامل فایل‌های بهینه‌شده‌ی اپلیکیشن خواهد بود.

---

## مرحله 3: نصب و تنظیم Nginx

### ۳.۱ نصب Nginx

```bash
apt update
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

### ۳.۲ ایجاد فایل کانفیگ برای IP سرور

```bash
sudo nano /etc/nginx/sites-available/warehouse-ip.conf
```

محتوای فایل:

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name #Your_Server_IP;

    root /var/www/warehouse-app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### ۳.۳ ایجاد فایل کانفیگ برای ساب‌دامنه

```bash
sudo nano /etc/nginx/sites-available/warehouse-anbar.conf
```

محتوای فایل:

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name YOUR_SERVER_DOMAIN;

    root /var/www/warehouse-app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### ۳.۴ فعال‌کردن سایت‌ها

```bash
sudo ln -sf /etc/nginx/sites-available/warehouse-ip.conf /etc/nginx/sites-enabled/warehouse-ip.conf
sudo ln -sf /etc/nginx/sites-available/warehouse-anbar.conf /etc/nginx/sites-enabled/warehouse-anbar.conf
```

### ۳.۵ بررسی صحت کانفیگ و ریلود

```bash
sudo nginx -t
```

اگر پیام `syntax is ok` و `test is successful` نمایش داد، سپس:

```bash
sudo systemctl reload nginx
```

---

## مرحله 4: تنظیم DNS (ساب‌دامنه)

برای دسترسی از طریق `Sub_DOMAIN`:

1. به پنل کنترل دامنه `DOMAIN.com` بروید.
2. یک رکورد **A** ایجاد کنید:
   - **Subdomain**: `WareHouse`
   - **Type**: `A`
   - **IP Address**: `Your_Server_IP`
   - **TTL**: Auto یا 300 ثانیه

3. ذخیره کنید و چند دقیقه منتظر بمانید تا DNS منتشر شود.

### بررسی DNS

```bash
ping WareHouse.Domain.com
```

اگر IP `Your_Server_IP` برگشت داد، DNS درست است.

---

## مرحله 5: تنظیم Firebase

### ۵.۱ Firebase Console

برنامه از Firebase Realtime Database استفاده می‌کند. تنظیمات Firebase در فایل `firebaseConfig.ts` موجود است:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyAgbUr2vyxzUJuJHI0TRV7hQruBU",
  authDomain: "warehouse-e15.firebaseapp.com",
  projectId: "warehouse-e15",
  storageBucket: "warehouse-e15.firebasestorage.app",
  messagingSenderId: "2322334992",
  appId: "1:232233834992:web:5ea91d27814afe9ea535",
  measurementId: "G-JSKEYED7E"
};
```

### ۵.۲ تنظیم Security Rules

برای حفاظت از دیتابیس، از قوانین امنیتی استفاده کنید. در Firebase Console → Realtime Database → Rules:

#### الف. برای محیط توسعه (Test Mode):

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

#### ب. برای محیط تولید (حداقلی محدود):

```json
{
  "rules": {
    ".read": true,

    "categories": {
      ".write": true
    },
    "products": {
      ".write": true
    },
    "customers": {
      ".write": true
    },
    "invoices": {
      ".write": true
    },
    "config": {
      ".write": true
    },
    "users": {
      ".write": true
    }
  }
}
```

#### ج. برای محیط تولید (با احراز هویت):

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

---

## مرحله 6: تنظیمات برنامه

### ۶.۱ تنظیمات سرور تصاویر

برنامه از API آپلود تصویر استفاده می‌کند. این تنظیم در بخش **تنظیمات** برنامه قابل دسترسی است.

1. برنامه را باز کنید.
2. به صفحه **تنظیمات** بروید.
3. آدرس سرور تصاویر را وارد کنید (مثلاً: `https://your-server.com/api/upload.php`).
4. دکمه **تست اتصال** را کلیک کنید.

### ۶.۲ تنظیمات گزارشات تلگرام

اگر می‌خواهید گزارشات خودکار حواله‌ها در تلگرام دریافت کنید:

1. Bot Token تلگرام خود را در بخش **گزارشات تلگرام** وارد کنید.
2. Chat ID را مشخص کنید.
3. چک‌باکس **فعال‌سازی اطلاع‌رسانی خودکار** را علامت بزنید.

**نکته**: Bot Token و Chat ID در Firebase Realtime Database ذخیره می‌شوند، نه در کد.

### ۶.۳ مدیریت کاربران

در بخش **تنظیمات → مدیریت دسترسی کاربران**:

1. کاربران جدید اضافه کنید.
2. نقش را تعیین کنید (مدیر، فروشنده، انباردار).
3. تنظیمات خودکار در دیتابیس ذخیره می‌شود.

---

## مرحله 7: بررسی نهایی و دسترسی

### ۷.۱ دسترسی از طریق IP

```
http://Your_Server_IP
```

### ۷.۲ دسترسی از طریق ساب‌دامنه

```
http://Warehouse.DOMAIN.com
```

اگر هر دو آدرس برنامه را درست نمایش دادند، نصب موفق است.

### ۷.۳ بررسی وضعیت Nginx

```bash
sudo systemctl status nginx
sudo service nginx status
```

---

## نکات مهم و بهترین روش‌ها

### ۸.۱ بکاپ‌گیری

Firebase خودکار بکاپ می‌گیرد، اما:

- از طریق Firebase Console → Realtime Database → Backups، زمان‌بندی بکاپ را تنظیم کنید.
- دستورات سرور را در یک فایل متنی نگهدارید.

### ۸.۲ نظارت و لاگ

```bash
# لاگ‌های Nginx
sudo tail -f /var/access_logs/access.log
sudo tail -f /var/access_logs/error.log

# بررسی وضعیت سرویس
systemctl status nginx
```

### ۸.۳ HTTPS (SSL/TLS)

برای امنیت بیشتر، از Let's Encrypt استفاده کنید:

```bash
apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d Warehouse.DOMAIN.com
```

### ۸.۴ به‌روزرسانی برنامه

اگر کد برنامه تغییر کرد:

```bash
cd /var/www/warehouse-app
git pull origin main
npm install
npm run build
sudo systemctl reload nginx
```

---

## حل مشکلات رایج

### مشکل: صفحه سیاه بعد از وارد کردن API تلگرام

**راه‌حل**: مقدار `config` را از Firebase حذف کنید و دوباره تلاش کنید. اطمینان حاصل کنید ساختار داده درست است.

### مشکل: `Cannot read properties of undefined`

**راه‌حل**: Firebase Rules یا ساختار داده‌ها خراب است. بخش مربوط به SettingsPage را بررسی کنید.

### مشکل: دسترسی تنها از IP نه از ساب‌دامنه

**راه‌حل**: بررسی کنید DNS ساب‌دامنه درست تنظیم شده‌ است:

```bash
nslookup Warehouse.DOMAIN.com
dig Warehouse.DOMAIN.com
```

### مشکل: Nginx `configuration test failed`

**راه‌حل**: بررسی کنید داخل فایل کانفیگ `sudo` یا دستورات شل نوشته نشده‌ است:

```bash
sudo nginx -T | grep -A5 warehouse
```

---

## خلاصه و نکات پایانی

✅ برنامه اکنون روی دو آدرس دسترسی‌پذیر است:
- `http://Your_Server_IP`
- `http://Warehouse.DOMAIN.com`

✅ تمام داده‌ها در Firebase Realtime Database ذخیره می‌شود.

✅ Nginx به‌عنوان Reverse Proxy و Static File Server عمل می‌کند.

✅ نقش‌های کاربری در برنامه مدیریت می‌شوند.

برای سوالات یا مشکلات بعدی، لاگ‌های Nginx و Console مرورگر را بررسی کنید.

---

**تاریخ**: ۱۴۰۴/۹/۲۸
**نسخه**: ۱.۰