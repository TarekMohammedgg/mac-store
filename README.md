# Mac Store · Inventory Catalog

A clean, production-quality inventory catalog for Apple devices and accessories. Built as a public
showcase for visitors with a private admin dashboard for managing the catalog. There is no
backend — every record lives in your browser via IndexedDB.

## Highlights

- **Two inventory types** — unique used devices (one record per physical unit) and quantity-based
  accessories.
- **Public catalog** — responsive browsing, search, filters, detail pages, image gallery with
  zoom.
- **Admin dashboard** — authentication, statistics, full CRUD for products and accessories,
  duplicate, image management, settings.
- **Zero backend** — IndexedDB through Dexie; all data and images stay in the browser.
- **Swappable data layer** — repositories expose async interfaces. Replace the Dexie
  implementations with REST clients without touching the UI.
- **Arabic + English** — full localization with automatic RTL mirroring. Switch from the header.
- **Light & Dark mode** — Light is the default for new visitors. Toggle in the header menu.
- **Apple-feel design** — neutral palette, generous whitespace, accessible.

## Stack

- Next.js 15 (App Router) · React 19 · TypeScript (strict)
- Tailwind CSS · shadcn/ui-style primitives (Radix)
- React Hook Form · Zod
- Dexie (IndexedDB) · dexie-react-hooks
- Zustand (auth only)
- Lucide icons · Sonner toasts
- ESLint · Prettier

## Localization & RTL

- Locales: `en` (default), `ar`.
- Locale is stored in a cookie (`macstore_locale`) and exposed via the `useI18n` hook.
- Strings live in `src/i18n/dictionaries/{en,ar}.ts`. The dictionary type is defined in
  `src/i18n/dictionary.types.ts`.
- The root layout reads the cookie and sets `<html lang="…">` and `<html dir="…">`. The
  `I18nProvider` syncs the DOM if the user changes locale.
- Layouts use logical Tailwind utilities (`ps-`, `pe-`, `text-start/end`) and `rtl:rotate-180`
  for directional icons.

## Theming

- Themes: `light` (default), `dark`, `system`.
- Preference is stored in a cookie (`macstore_theme`).
- Open the header settings menu (palette icon) to switch theme and language.
- The first paint is Light unless the cookie says otherwise.

## Project structure

```
src/
├── app/                        # Next.js routes
│   ├── (public)/               # Visitor pages
│   ├── admin/                  # Auth-gated dashboard
│   ├── login/                  # Sign-in page
│   ├── error.tsx               # Global error boundary
│   └── not-found.tsx
├── components/
│   ├── ui/                     # shadcn-style primitives
│   ├── layout/                 # Header, footer, theme, auth bootstrap, settings menu
│   ├── shared/                 # Image gallery, thumb, uploader
│   ├── products/               # Product-specific UI
│   ├── accessories/            # Accessory-specific UI
│   ├── admin/                  # Admin shell + forms
│   └── forms/                  # RHF field wrappers
├── features/
│   ├── products/               # Explorer + URL-synced filters
│   └── accessories/            # Explorer + URL-synced filters
├── repositories/               # Data layer (the swap point)
│   ├── *.repository.ts         # Dexie implementations
│   └── *-repository.types.ts   # Interfaces matching a future REST shape
├── services/                   # Business logic orchestration
├── models/                     # Domain types
├── lib/                        # DB, format, hash, constants, utils
├── hooks/                      # Image, image-list, local images, auth guard, labels
├── stores/                     # Auth Zustand store
├── i18n/                       # Dictionaries, provider, types
├── validation/                 # Zod schemas
└── config/                     # App + locale config
```

## Architecture

### Data flow

```
Component / page
   ↓ uses
Service (product, accessory, auth, settings)
   ↓ uses
Repository (interface)
   ↓ implemented by
Dexie (IndexedDB)
```

To migrate to a REST backend, implement the existing repository interfaces with an HTTP client
and swap the bindings in `src/repositories/index.ts`. Nothing else changes.

### Auth

- Single administrator account, seeded on first load from
  `NEXT_PUBLIC_DEFAULT_ADMIN_USERNAME` / `NEXT_PUBLIC_DEFAULT_ADMIN_PASSWORD`
  (defaults: `admin` / `admin1234`).
- Passwords are hashed with PBKDF2 (SHA-256, 120k iterations) using Web Crypto.
- Sessions are stored in IndexedDB and tracked through a Zustand store. The session token lives in
  `sessionStorage` for fast access. Replace `authService` with a real auth client to switch to a
  backend.

### Storage

- One IndexedDB database (`mac_store_inventory`) with tables: `products`, `accessories`,
  `images`, `users`, `settings`, `authSessions`.
- Images are stored as `Blob`s. They are converted to object URLs on read and revoked on unmount
  via custom hooks.

### Forms

Every form is wired to `react-hook-form` + `@hookform/resolvers/zod` with strongly typed
schemas in `src/validation/`. Errors render inline below fields.

## Scripts

```bash
npm run dev          # Local dev server
npm run build        # Production build
npm start            # Start production server
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run format       # Prettier write
```

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Sign in at <http://localhost:3000/login> with the seeded
credentials. From the admin dashboard, click **Add sample data** in Settings to populate the
catalog quickly.

## Migration to a REST backend

1. Implement the interfaces in `src/repositories/*-repository.types.ts` with a fetch-based
   client.
2. Update `src/repositories/index.ts` to return the HTTP implementations.
3. No UI, service, model, or validation changes are required.

## Notes

- No `localStorage` is used. Theme and locale preferences persist in cookies. Sessions persist in
  IndexedDB; the token lives in `sessionStorage`.
- Image uploads support JPG, PNG, WebP, GIF and AVIF up to 8 MB.
- Pages are server-rendered on demand because the root layout reads the locale cookie. Public
  listings still feel instant — they hydrate from IndexedDB.
