# Environment Configuration

This document describes all environment variables used in the PulseLedger application.

## Backend Environment Variables (.env)

### Server Configuration
- `PORT=3000` - Backend server port
- `NODE_ENV=development` - Environment mode (development/production)
- `JWT_SECRET=hospital-accounts-secret-key-2024` - JWT signing secret

### Default Admin User
- `DEFAULT_ADMIN_PASSWORD=admin123` - Default admin password

### Default Currency Settings
- `DEFAULT_CURRENCY_SYMBOL=৳` - Default currency symbol
- `DEFAULT_CURRENCY_CODE=BDT` - Default currency code (ISO 4217)
- `DEFAULT_CURRENCY_NAME=Bangladeshi Taka` - Default currency name
- `DEFAULT_CURRENCY_POSITION=before` - Symbol position (before/after amount)

### Default Hospital Branding
- `DEFAULT_HOSPITAL_NAME=PulseLedger Hospital` - Default hospital name
- `DEFAULT_HOSPITAL_ADDRESS=123 Medical Center Drive, Dhaka, Bangladesh` - Default address
- `DEFAULT_HOSPITAL_CONTACT=+880 2 1234 5678` - Default contact number
- `DEFAULT_HOSPITAL_TAGLINE=Excellence in Healthcare Management` - Default tagline

### Default Localization Settings
- `DEFAULT_LANGUAGE=en` - Default language code
- `DEFAULT_DATE_FORMAT=DD/MM/YYYY` - Default date format
- `DEFAULT_TIME_FORMAT=12h` - Default time format (12h/24h)
- `DEFAULT_TIMEZONE=Asia/Dhaka` - Default timezone

## Frontend Environment Variables (.env)

### API Configuration
- `VITE_API_BASE=http://localhost:3000` - Backend API base URL

## Customization Examples

### For Philippine Peso (PHP)
```bash
DEFAULT_CURRENCY_SYMBOL=₱
DEFAULT_CURRENCY_CODE=PHP
DEFAULT_CURRENCY_NAME=Philippine Peso
DEFAULT_HOSPITAL_ADDRESS=123 Medical Center Drive, Metro Manila, Philippines
DEFAULT_HOSPITAL_CONTACT=+63 2 1234 5678
```

### For US Dollar (USD)
```bash
DEFAULT_CURRENCY_SYMBOL=$
DEFAULT_CURRENCY_CODE=USD
DEFAULT_CURRENCY_NAME=US Dollar
DEFAULT_HOSPITAL_ADDRESS=123 Medical Center Drive, New York, USA
DEFAULT_HOSPITAL_CONTACT=+1 555 123 4567
```

### For Euro (EUR)
```bash
DEFAULT_CURRENCY_SYMBOL=€
DEFAULT_CURRENCY_CODE=EUR
DEFAULT_CURRENCY_NAME=Euro
DEFAULT_HOSPITAL_ADDRESS=123 Medical Center Drive, Berlin, Germany
DEFAULT_HOSPITAL_CONTACT=+49 30 1234 5678
```

## How to Apply Changes

1. **Update environment variables** in `backend/.env` and `frontend/.env`
2. **Reset the database** to apply new defaults:
   ```bash
   cd backend && ./reset-db.sh
   ```
3. **Restart the development servers**:
   ```bash
   ./start-dev.sh
   ```

## Notes

- All currency settings can be changed through the Settings UI after initial setup
- Environment variables only set the initial defaults
- Database reset is required to apply new environment-based defaults
- Frontend will automatically pick up new API base URL without restart 