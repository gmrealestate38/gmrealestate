# GM Real Estate - Django Backend

Yeh backend `properties` aur `accounts` do apps par mabni hai, Django REST
Framework (DRF) ke sath. Yeh frontend ke `localStorage`-based data model
(gm_properties, gm_users, gm_contact_log, gm_saved_properties) ko replace
karne ke liye bana hai.

## 1. Setup (pehli dafa)

```bash
# 1. Is folder mein aa jayein
cd backend

# 2. Virtual environment banayein (recommended)
python -m venv venv

# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 3. Packages install karein
pip install -r requirements.txt

# 4. Database tables banayein
python manage.py makemigrations
python manage.py migrate

# 5. Apna admin/owner account banayein (Django admin ke liye)
python manage.py createsuperuser

# 6. Server chalayein
python manage.py runserver
```

Server ab `http://127.0.0.1:8000` par chal raha hoga.

- Django Admin panel: `http://127.0.0.1:8000/admin/` (yahan properties,
  users, contact logs sab directly dekh/edit kar sakte hain -- yeh
  "owner-dashboard.html" ka backend-side alternative bhi hai)
- API base URL: `http://127.0.0.1:8000/api/`

## 2. Available API Endpoints

### Accounts (`/api/accounts/`)
| Method | URL | Kaam |
|---|---|---|
| POST | `/api/accounts/signup/user/` | User signup (name, email, phone, city, password) |
| POST | `/api/accounts/signup/agent/` | Agent signup (name, agency, email, phone, cnic, town, experience, password) |
| POST | `/api/accounts/login/` | Login (email, password) -> token milta hai |
| POST | `/api/accounts/logout/` | Logout (token header chahiye) |
| GET | `/api/accounts/me/` | Current logged-in user ki profile |

### Properties (`/api/properties/`)
| Method | URL | Kaam |
|---|---|---|
| GET | `/api/properties/properties/` | Saari properties (query params se filter: `?purpose=`, `?category=`, `?city=`, `?district=`, `?town=`, `?min_price=`, `?max_price=`) |
| POST | `/api/properties/properties/` | Nayi property post karna (sirf Agent, multipart/form-data with `images` files) |
| GET | `/api/properties/properties/{id}/` | Ek property ki detail |
| PATCH/PUT | `/api/properties/properties/{id}/` | Edit karna (sirf jis Agent ne post ki thi) |
| DELETE | `/api/properties/properties/{id}/` | Delete karna (sirf owner Agent) |
| GET | `/api/properties/properties/my_listings/` | Login Agent ki apni properties |
| POST | `/api/properties/properties/{id}/mark_sold/` | Sold mark karna (`rating`, `feedback` body mein) |
| POST | `/api/properties/properties/{id}/contact/` | Contact Agent button dabane par (agent phone wapis milta hai + log hota hai) |
| GET | `/api/properties/contact-logs/` | Owner Dashboard ke liye poora contact log |
| GET | `/api/properties/saved/` | Login user ki saved properties |
| POST | `/api/properties/saved/` | Property save karna (`{"property": <id>}`) |
| DELETE | `/api/properties/saved/{property_id}/` | Unsave karna |

## 3. Authentication kaise bhejein

Login/signup response mein ek `token` milta hai. Har agli request (jo
login required ho) ke header mein yeh bhejna hoga:

```
Authorization: Token <yahan-token-paste-karein>
```

## 4. Agla step: Frontend ko is API se connect karna

Abhi frontend (index.html, form.html, waghera) `localStorage` use karta
hai. Isay is API se connect karne ke liye har JS file mein
`localStorage.getItem/setItem` calls ki jagah `fetch()` calls lagani
hongi (e.g. `fetch('http://127.0.0.1:8000/api/properties/properties/')`).

Yeh kaam abhi nahi kiya gaya -- pehle backend ko khud chala kar test
kar lein (Django Admin ya Postman/curl se), phir agla step (frontend
integration) mil kar karte hain.

## 5. Koi error aaye to

Agar `python manage.py runserver` ya migrations chalate waqt koi error
aaye, poora error message copy karke bhej dein -- is sandbox mein
internet na hone ki wajah se main khud Django install/run nahi kar
sakti thi, is liye yeh zaroor ho sakta hai ke chhoti motti cheez fix
karni pade.