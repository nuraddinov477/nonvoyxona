# 🚀 Nonvoyxona Deploy Qo'llanmasi

## 1️⃣ GitHub'ga yuklash

### A. GitHub akkaunti yarating (agar yo'q bo'lsa)
1. https://github.com/signup ga kiring
2. Username, email, parol bilan ro'yxatdan o'ting

### B. Yangi repository yarating
1. https://github.com/new ga kiring
2. **Repository name:** `nonvoyxona`
3. **Public** tanlang
4. ❌ "Add a README file" ni **belgilamang**
5. **"Create repository"** tugmasini bosing

### C. WSL terminalda commit qilib push qiling
```bash
cd /mnt/c/Users/Sarvarbek/projects/nonvoyxona

git commit -m "Initial commit: Nonvoyxona ERP system"

# YOUR-USERNAME ni o'z GitHub username'ingiz bilan almashtiring
git remote add origin https://github.com/YOUR-USERNAME/nonvoyxona.git
git push -u origin main
```

GitHub login/password so'rasa, `Personal Access Token` kerak bo'ladi:
- https://github.com/settings/tokens → **Generate new token (classic)**
- Hamma `repo` huquqlarini belgilang
- Password o'rniga shu tokenni ishlating

---

## 2️⃣ Backend'ni Render.com'ga deploy qilish

### A. Akkaunt yarating
1. https://render.com → **Get Started** → **GitHub** orqali kirish
2. GitHub'da kerakli ruxsatlarni bering

### B. Yangi Web Service yarating
1. Dashboard → **+ New** → **Web Service**
2. **Connect a repository** → `nonvoyxona` ni tanlang
3. Sozlamalar:
   - **Name:** `nonvoyxona-backend`
   - **Region:** Frankfurt (Europe)
   - **Branch:** `main`
   - **Root Directory:** (bo'sh qoldiring)
   - **Runtime:** `Python 3`
   - **Build Command:** `./build.sh`
   - **Start Command:** `gunicorn config.wsgi:application`
   - **Instance Type:** `Free`

### C. Environment Variables qo'shing
**"Advanced" → Add Environment Variable:**
| Key | Value |
|-----|-------|
| `PYTHON_VERSION` | `3.11.0` |
| `SECRET_KEY` | (random uzun string, masalan: `xK9!mP2$nQ8@vL5*wR3#hT7`) |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `*` |
| `CORS_ALLOW_ALL` | `True` |

### D. Deploy
- **"Create Web Service"** tugmasini bosing
- ~5-10 daqiqa kutting (build vaqti)
- **Live URL** olasiz: `https://nonvoyxona-backend-XXXX.onrender.com`

### E. Tekshiring
Brauzerda oching: `https://nonvoyxona-backend-XXXX.onrender.com/admin/`
Login: `admin` / `admin123`

---

## 3️⃣ Frontend'ni Vercel'ga deploy qilish

### A. Backend URL'ni yozing
`frontend/.env.production` faylini oching va URL'ni yangilang:
```
REACT_APP_API_URL=https://nonvoyxona-backend-XXXX.onrender.com/api
```

`.env.production` fayli o'zgartirilgan bo'lsa, GitHub'ga push qiling:
```bash
git add frontend/.env.production
git commit -m "Update production API URL"
git push
```

### B. Vercel akkaunti
1. https://vercel.com → **Sign Up** → **Continue with GitHub**

### C. Yangi Project yarating
1. **Add New** → **Project**
2. `nonvoyxona` repositoryni tanlang → **Import**
3. Sozlamalar:
   - **Framework Preset:** `Create React App`
   - **Root Directory:** `frontend`
   - **Build Command:** (avtomatik)
   - **Output Directory:** (avtomatik)

### D. Environment Variables
**Environment Variables** bo'limida qo'shing:
| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://nonvoyxona-backend-XXXX.onrender.com/api` |

### E. Deploy
- **"Deploy"** tugmasini bosing
- ~2-3 daqiqa kutting
- URL'ni olasiz: `https://nonvoyxona-XXXX.vercel.app`

---

## 4️⃣ Backend'da CORS va CSRF sozlash

Vercel URL'ingiz tayyor bo'lgach, **Render.com Dashboard'ga qayting** va Backend'ning **Environment Variables**'iga quyidagilarni qo'shing:

| Key | Value |
|-----|-------|
| `CSRF_TRUSTED_ORIGINS` | `https://nonvoyxona-XXXX.vercel.app` |
| `CORS_ALLOWED_ORIGINS` | `https://nonvoyxona-XXXX.vercel.app` |

Keyin **"Manual Deploy" → "Deploy latest commit"** tugmasini bosing.

---

## ✅ Tayyor!

- 🌐 **Frontend:** `https://nonvoyxona-XXXX.vercel.app`
- 🔧 **Backend:** `https://nonvoyxona-backend-XXXX.onrender.com/api`
- 👤 **Login:** `admin` / `admin123`

---

## ⚠️ Eslatmalar

### Bepul plan'da cheklovlar:
- **Render bepul** — 15 daqiqa ishlatilmasa "uxlaydi" (birinchi so'rov 30 sekund kutadi)
- **Vercel** — 100 GB trafik/oy bepul

### SQLite bilan ishlash:
- Render'da har deploy'da SQLite **o'chiriladi** (data yo'qoladi)
- **Yechim:** Persistent disk qo'shish ($1/oy) yoki **PostgreSQL** ga o'tish

### Keyinroq PostgreSQL'ga o'tish:
1. https://neon.tech'da bepul PostgreSQL yarating
2. Render'ga `DATABASE_URL` env variable qo'shing
3. Code o'zgartirilgan — avtomatik PostgreSQL'ga ulanadi

---

## 🆘 Muammolarda

### Backend "Application failed"
- Render Dashboard → **Logs** ko'ring
- Odatda `migrate` xatosi — Render'ga `python manage.py migrate` qo'shing

### Frontend "Network Error"
- F12 → Console qarang
- `REACT_APP_API_URL` to'g'ri yozilganligini tekshiring
- Backend URL ishlayotganligini brauzerda tekshiring

### CORS xatosi
- Backend'da `CORS_ALLOWED_ORIGINS` ga frontend URL qo'shilganligini tekshiring
- Yoki `CORS_ALLOW_ALL=True` qo'ying
