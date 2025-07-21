# Language Files

This directory contains language files for the Hospital Accounts Management System.

## File Format

Each language file should be named `{languageCode}.lang` (e.g., `en.lang`, `bn.lang`, `es.lang`) and follow this format:

```
# Language File
# Format: key=value

# App Navigation
hospitalAccounts=Hospital Accounts Management
dashboard=Dashboard
pos=POS
sales=Sales
expenses=Expenses
products=Products
users=Users
roles=Roles
settings=Settings
logout=Logout
expandSidebar=Expand sidebar
collapseSidebar=Collapse sidebar
theme=Theme

# Settings Page
systemSettings=System Settings
localization=Localization
branding=Branding
currency=Currency
saveSettings=Save Settings
saving=Saving...
settingsSaved=Settings saved successfully
settingsError=Failed to save settings

# Localization Settings
language=Language
dateFormat=Date Format
timeFormat=Time Format
timezone=Timezone
english=English
bengali=Bengali
spanish=Spanish
twelveHour=12-hour (AM/PM)
twentyFourHour=24-hour

# Branding Settings
hospitalName=Hospital Name
address=Address
contactNumber=Contact Number
tagline=Tagline
enterHospitalName=Enter hospital name
enterAddress=Enter hospital address
enterContact=Enter contact number
enterTagline=Enter hospital tagline

# Theme Settings
themeMode=Theme Mode
system=System
light=Light
dark=Dark

# Currency Settings
currencySymbol=Currency Symbol
currencyCode=Currency Code
currencyName=Currency Name
symbolPosition=Symbol Position
enterSymbol=Enter currency symbol
enterCode=Enter currency code
enterName=Enter currency name
beforeAmount=Before amount (₱100)
afterAmount=After amount (100₱)

# Page Titles
pageDashboard=Dashboard - Hospital Accounts
pagePOS=POS - Hospital Accounts
pageSales=Sales - Hospital Accounts
pageExpenses=Expenses - Hospital Accounts
pageProducts=Products - Hospital Accounts
pageUsers=Users - Hospital Accounts
pageRoles=Roles - Hospital Accounts
pageSettings=Settings - Hospital Accounts
pageLogin=Login - Hospital Accounts
```

## Adding a New Language

To add a new language:

1. Create a new file named `{languageCode}.lang` in this directory
2. Copy the structure from `en.lang` and translate all values
3. Update `frontend/src/utils/languageLoader.js` to include the new language code in the `getAvailableLanguages()` function
4. Update `frontend/src/pages/Settings.jsx` to handle the new language in the language selection dropdown

### Example: Adding French

1. Create `fr.lang`:
```
# French Language File
hospitalAccounts=Gestion des Comptes de l'Hôpital
dashboard=Tableau de Bord
pos=Point de Vente
# ... translate all other keys
```

2. Update `languageLoader.js`:
```javascript
export async function getAvailableLanguages() {
  return ['en', 'bn', 'es', 'fr'] // Add 'fr'
}
```

3. Update `Settings.jsx`:
```javascript
{t(lang === 'en' ? 'english' : lang === 'bn' ? 'bengali' : lang === 'es' ? 'spanish' : lang === 'fr' ? 'french' : lang)}
```

## Available Languages

- `en.lang` - English
- `bn.lang` - Bengali
- `es.lang` - Spanish

## Notes

- Comments start with `#`
- Each translation is in `key=value` format
- Empty lines are ignored
- The system automatically falls back to English if a language file fails to load
- Language files are cached for performance
- Page titles are automatically updated based on the current language and route 