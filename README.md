# HimRoutes replica

A React/Vite front end with an Express API for storing trek enquiries.

## Run locally

```powershell
npm install
npm run build
npm start
```

Open `http://localhost:4173`.

Enquiries are stored in `data/enquiries.json` (intentionally ignored by Git). The admin login defaults to `admin@himroutes.in` and `change-me-before-deployment`; change both before deploying:

```powershell
$env:ADMIN_EMAIL = 'your-admin@example.com'
$env:ADMIN_PASSWORD = 'a-long-unique-password'
npm start
```

For production, replace the JSON store with a managed database and put the admin credentials in the deployment secret manager.
