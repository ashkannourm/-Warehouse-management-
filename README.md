<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# این فایل‌های برنامه است

گزارش فوق را به فارسی بنویس
همچنین با استفاده از فایل installation Guide نحوه آموزش نصب برنامه بر روی سرور ubuntu را بنوسی

یک README فارسی متناسب با ساختار فعلی پروژه‌ات (Vite + React + TypeScript + Gemini + Firebase) و همین‌طور راهنمای نصب روی Ubuntu طبق فایل نصب آماده است.[^1][^2]

## متن README فارسی برای گیت‌هاب

این را به‌جای محتوای فعلی در `README.md` بگذار (یا در کنار نسخه انگلیسی اضافه کن):

```markdown
# داشبورد انبار و چت هوشمند (React + Vite + TypeScript)

این پروژه یک داشبورد تحت وب برای مدیریت موجودی انبار، مشتریان، فاکتورها و تنظیمات است که با **React + TypeScript + Vite** ساخته شده و از **مدل Gemini (Google AI)** برای دستیار هوشمند و از **Firebase** برای سرویس‌های فرانت‌اند استفاده می‌کند.

## امکانات

- **داشبورد مدیریتی**: نمایش وضعیت کلی انبار و اطلاعات کلیدی.
- **مدیریت موجودی**: مشاهده و مدیریت کالاها، دسته‌بندی‌ها و موجودی انبار.
- **مدیریت مشتریان و فاکتورها**: صفحات جداگانه برای Customers و Invoices.
- **صفحه تنظیمات**: تنظیمات پایه‌ای اپلیکیشن.
- **چت هوشمند**: کامپوننت‌های چت (ChatPage / FloatingChatBox) با اتصال به Gemini برای پاسخ‌های هوش مصنوعی.
- **TypeScript و ساختار ماژولار**: استفاده از `types.ts`، `constants.ts`، `api.ts` و `geminiService.ts` برای ساختاردهی بهتر کد.
- **ساخته شده با Vite**: سرعت بالا در توسعه و Build سبک برای محیط تولید.

## تکنولوژی‌ها

- **React + TypeScript**
- **Vite** (پیکربندی در `vite.config.ts`)
- **Firebase** (تنظیمات در `firebaseConfig.ts`)
- **Google Gemini API** (سرویس هوش مصنوعی در `geminiService.ts`)
- **NPM** برای مدیریت پکیج‌ها (`package.json`)

## اجرای پروژه به‌صورت محلی

### پیش‌نیازها

- نصب بودن **Node.js** (ترجیحاً نسخه LTS)
- دسترسی به اینترنت برای استفاده از Gemini / Firebase (در صورت فعال بودن این بخش‌ها)

### مراحل اجرا

1. کلون کردن مخزن:

```

git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>

```

2. نصب وابستگی‌ها:

```

npm install

```

3. تنظیم متغیرهای محیطی (در صورت نیاز):

- ایجاد فایل `.env.local` و تنظیم کلیدها، مثلاً:

  ```
  GEMINI_API_KEY=your_gemini_api_key
  # سایر متغیرها مثل آدرس API بک‌اند در صورت وجود
  ```

- تنظیمات Firebase نیز در فایل `firebaseConfig.ts` قابل ویرایش است.

4. اجرای برنامه در حالت توسعه:

```

npm run dev

```

سپس آدرس نمایش‌داده شده در ترمینال (مثلاً `http://localhost:5173`) را در مرورگر باز کنید.

5. ساخت نسخه تولید (Production):

```

npm run build

```

خروجی نهایی در پوشه `dist/` قرار می‌گیرد و برای استقرار روی سرور (Nginx و غیره) استفاده می‌شود.

## ساختار کلی پروژه

```

.
├── App.tsx
├── index.html
├── index.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
├── constants.ts
├── api.ts
├── geminiService.ts
├── firebaseConfig.ts
├── types.ts
└── components/
├── Dashboard.tsx
├── InventoryPage.tsx
├── CustomersPage.tsx
├── InvoicesPage.tsx
├── CategoriesPage.tsx
├── SettingsPage.tsx
├── ChatPage.tsx
└── FloatingChatBox.tsx

```

- `App.tsx`: شِل اصلی اپلیکیشن و روتینگ/لِی‌آوت.
- `components/*`: صفحات و کامپوننت‌های اصلی داشبورد.
- `geminiService.ts`: هندل کردن درخواست‌ها به Gemini.
- `firebaseConfig.ts`: تنظیمات اتصال به Firebase.
- `constants.ts` و `types.ts`: ثابت‌ها و انواع TypeScript.
- `vite.config.ts`: تنظیمات Vite.

## استقرار روی سرور Ubuntu (نصب و دیپلوی)

برای دیپلوی نسخه تولیدی این پروژه روی یک سرور Ubuntu با Nginx، می‌توانی طبق این مراحل عمل کنی (برگرفته از فایل `installation-Guide.txt` و کمی مرتب‌شده):

### ۱. آماده‌سازی پوشه و انتقال فایل‌ها

1. روی سرور:

```

sudo mkdir -p /var/www/warehouse-app
cd /var/www/warehouse-app

```

2. فایل zip پروژه (یا خروجی build) را به این پوشه منتقل کن (مثلاً با `scp` یا FTP).

3. نصب unzip (در صورت نیاز):

```

sudo apt install unzip

```

4. اکسترکت کردن فایل zip:

```

unzip <project-file-name>.zip
cd <project-folder>   \# اگر داخل پوشه جدید قرار می‌گیرد

```

### ۲. نصب Node و Build فرانت‌اند

1. نصب npm (اگر از قبل نصب نیست):

```

sudo apt install npm

```

2. نصب وابستگی‌های پروژه:

```

npm install

```

3. ساخت نسخه Production:

```

npm run build

```

بعد از اجرای این دستور، پوشه `dist/` ساخته می‌شود و این پوشه را در تنظیمات Nginx به‌عنوان root معرفی خواهی کرد.[file:61]

### ۳. نصب و تنظیم Nginx

1. به‌روزرسانی پکیج‌ها و نصب Nginx:

```

sudo apt update
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

```

2. ایجاد فایل کانفیگ سایت:

```

sudo nano /etc/nginx/sites-available/warehouse-app

```

3. قرار دادن کانفیگ مشابه زیر (آی‌پی یا دامنه را مطابق سرورت تنظیم کن):

```

server {
listen 80;
listen [::]:80;

       server_name 45.80.230.207;  # یا دامنه شما
    
       root /var/www/warehouse-app/dist;
       index index.html;
    
       location / {
           try_files $uri $uri/ /index.html;
       }
    }

```

مسیر `root` را طوری تنظیم کن که به پوشه `dist` همین پروژه اشاره کند.[file:61]

4. فعال کردن سایت:

```

sudo ln -s /etc/nginx/sites-available/warehouse-app /etc/nginx/sites-enabled/warehouse-app

```

5. تست صحت کانفیگ و ری‌لود Nginx:

```

sudo nginx -t
sudo systemctl reload nginx

```

حالا با زدن آی‌پی/دامنه روی پورت ۸۰ باید نسخه Production اپلیکیشن بالا بیاید.[file:61]

### ۴. نصب Firebase (در صورت نیاز روی سرور توسعه)

اگر روی سرور هم نیاز به نصب پکیج Firebase در مرحله build داشته باشی (در `installation-Guide` اشاره شده):

```

npm install firebase

```

سپس طبق تنظیمات موجود در `firebaseConfig.ts` و کدی که در فایل نصب آمده، Firebase روی فرانت‌اند مقداردهی می‌شود.[file:61]

---

اگر بخواهی README را دو زبانه (فارسی/انگلیسی) کنی یا بخشی مثل «پیکربندی Gemini» و «متغیرهای محیطی دقیق» را هم اضافه کنیم، می‌توان بخش متغیرها را بر اساس محتوای `geminiService.ts` و `api.ts` هم برایت تکمیل کرد.


<div align="center">⁂</div>

[^1]: installation-Guide.txt
[^2]: README.md```

