<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# فایلهای نحوه نصب را مجدد نمایش بده

راهنمای نصب که قبلاً برات نوشتم را این‌جا دوباره، به‌صورت یک فایل Markdown قابل‌کپی می‌گذارم تا مستقیماً در گیت‌هاب استفاده کنی.[^1][^2]

```markdown
# Warehouse App – Server Installation Guide

این راهنما نحوه استقرار برنامه مدیریت انبار روی سرور Ubuntu با Nginx و Firebase را توضیح می‌دهد. در مثال‌ها، `YOUR_IP` و `YOUR_DOMAIN` را با اطلاعات واقعی سرور خود جایگزین کنید.

---

## 1. آماده‌سازی سرور

### 1.1 ایجاد فولدر پروژه

```

sudo mkdir -p /var/www/warehouse-app
cd /var/www/warehouse-app

```

فایل zip پروژه را به این مسیر منتقل کنید (مثلاً با `scp`) و سپس:

```

apt install -y unzip
unzip your-project.zip   \# نام واقعی فایل را بگذارید

```

---

## 2. نصب Node.js و ساختن پروژه

```

apt install -y npm nodejs
cd /var/www/warehouse-app
npm install
npm run build

```

بعد از `npm run build` خروجی نهایی در پوشه `dist` قرار می‌گیرد.

---

## 3. نصب و تنظیم Nginx

### 3.1 نصب Nginx

```

apt update
apt install -y nginx
systemctl enable nginx
systemctl start nginx

```

### 3.2 ساخت فایل کانفیگ سایت

```

nano /etc/nginx/sites-available/warehouse-app

```

محتوا:

```

server {
listen 80;
listen [::]:80;

    server_name YOUR_IP YOUR_DOMAIN;
    
    root /var/www/warehouse-app/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    }

```

- اگر فقط با IP کار می‌کنید، می‌توانید فقط `YOUR_IP` را بنویسید.
- اگر IP و دامنه هر دو مدنظر است، هر دو را بعد از `server_name` قرار دهید.

### 3.3 فعال‌سازی سایت و ریلود

```

ln -s /etc/nginx/sites-available/warehouse-app /etc/nginx/sites-enabled/warehouse-app

nginx -t
systemctl reload nginx

```

---

## 4. تنظیم Firebase در فرانت‌اند

در فایل `firebaseConfig.ts` پیکربندی وب‌اپ Firebase را قرار دهید. نمونه کلی: [file:264][web:88]

```

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

export const firebaseConfig = {
apiKey: "YOUR_API_KEY",
authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
projectId: "YOUR_PROJECT_ID",
storageBucket: "YOUR_PROJECT_ID.appspot.com",
messagingSenderId: "YOUR_SENDER_ID",
appId: "YOUR_APP_ID",
databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.YOUR_REGION.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

```

مقادیر را از بخش Project settings در Firebase Console بردارید.

---

## 5. قوانین پیشنهادی Firebase برای توسعه

برای تست (Dev) می‌توانید از این Rules استفاده کنید:

```

{
"rules": {
".read": true,
".write": true
}
}

```

یا نسخه کمی محدودتر: [web:135]

```

{
"rules": {
".read": true,
"categories": { ".write": true },
"products":  { ".write": true },
"customers": { ".write": true },
"invoices":  { ".write": true },
"config":    { ".write": true },
"users":     { ".write": true }
}
}

```

---

## 6. دسترسی نهایی

پس از تنظیمات:

- با IP: `http://YOUR_IP`
- با دامنه: `http://YOUR_DOMAIN`

برنامه باید لود شود و به Firebase متصل باشد.

برای فعال‌کردن HTTPS با Let’s Encrypt می‌توانید بعداً روی سرور این مراحل را انجام دهید:

```

apt install -y certbot python3-certbot-nginx
certbot --nginx -d YOUR_DOMAIN

```

که به‌طور خودکار گواهی TLS می‌گیرد و ریدایرکت به `https` را تنظیم می‌کند. [web:217][web:226]
```

<span style="display:none">[^3][^4][^5]</span>

<div align="center">⁂</div>

[^1]: installation-Guide.txt

[^2]: App.tsx

[^3]: firebaseConfig.ts

[^4]: types.ts

[^5]: package.json

