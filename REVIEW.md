# Autovaca — Build Review

## What was built

Complete React app scaffold with all core features:

### Data Layer
- `src/services/settlement.js` — Settlement algorithm: computes net balances per participant, minimum transfers (greedy), and pairwise matrix
- `src/services/fxRates.js` — FX rate service: fetches AR$ blue (dolarapi.com), CLP rates, with memory + Firestore caching
- `src/services/firestore.js` — Full CRUD for groups, transactions, settlements
- `src/firebase.js` — Firebase init (needs API key config)

### UI Components
- `TransactionForm` — Full expense entry form: payer, concept, date, amount+currency, FX conversion display, equal/custom split with participant checkboxes
- `SettlementView` — Net balances + minimum transfers to settle
- `TransactionLog` — Searchable, filterable transaction list
- `ShareView` — Screenshot-optimized receipt + settlement (WhatsApp-ready)
- `TarjetaMamaView` — Yearly summaries with monthly drill-down for mother's CC
- `Dashboard` — Group list, create new groups with participants

### App Shell
- `App.jsx` — Tab-based layout (New, Log, Settlement, Mamá, Share)
- Auto-switches to Share view after adding a transaction
- Dark theme, Tailwind CSS

### Deployment
- `firebase.json` + `.firebaserc` — Firebase Hosting config
- `firestore.rules` — Security rules (read=public, write=authenticated)
- `.github/workflows/deploy.yml` — GitHub Actions auto-deploy on push to main
- `.gitignore`

## What still needs to be done

### Before first deploy
1. **Firebase web app config** — Go to Firebase Console → Project Settings → General → Add web app → Copy the config object into `src/firebase.js`
2. **Create GitHub repo** — via browser at github.com/new, name it `autovaca`
3. **Push code** — git init, commit, push to the new repo
4. **Firebase service account** — For GitHub Actions deploy, generate a service account key and add as GitHub secret `FIREBASE_SERVICE_ACCOUNT`
5. **Enable Firebase Authentication** — In Firebase Console, enable Email/Password auth for Juan's login

### Phase 3: Data Migration (next session)
- Export spreadsheet data
- Parse dates with mm/dd vs dd/mm resolution
- Transform to Firestore documents
- Import and validate against legacy settlement numbers

### Phase 5: Polish
- Mobile responsive tweaks
- CSV/PDF export
- Read-only public view (separate route, no edit controls)
- Proper error handling and loading states
