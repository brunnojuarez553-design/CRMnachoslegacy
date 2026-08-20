# Nacho's Legacy — Garage OS

Professional bilingual CRM / collision-management workspace for **Nacho's Legacy Body Shop, Lansdowne, Pennsylvania**.

## Current product focus

The platform is now US-first for communication:

- **SMS / Text Messages** — primary customer messaging channel.
- **Instagram DMs** — acquisition and conversation channel.
- **Landing + Website Intake** — structured collision inquiries with photos.
- **Phone calls** — CRM logging model included.
- **WhatsApp** — optional, not part of the primary workflow.

> iMessage itself is not treated as an open business API. Garage OS uses SMS/Text as the automatable phone-messaging channel while keeping manual call/message context in the CRM.

## Modules

- Executive Dashboard
- Leads
- Collision Center
- Customers
- Vehicles
- Estimates / Revenue Recovery
- Repair Board
- Communication Center
- Calendar / Shop Capacity
- Growth / Revenue Attribution
- Settings
- Legacy Intelligence (EN / ES)

## Professional data exports

Every major operational area can be downloaded as UTF-8 CSV for Excel / Google Sheets:

- Leads
- Customers
- Vehicles
- Collision cases
- Estimates
- Active repair jobs
- Conversations
- Calendar
- Growth attribution

Lists have a global **Export CSV** button and major record tables/cards include per-record export controls. Export headers follow the active EN / ES language.

## Local install

```bash
npm install
npm run build
npm run dev
```

Open `http://localhost:3000/dashboard`.

## Supabase

Apply migrations with:

```powershell
$env:SUPABASE_PROJECT_REF="YOUR_PROJECT_REF"
npm run supabase:setup
```

The newest migration is:

`supabase/migrations/20260820210000_us_communication_exports.sql`

It enables SMS as a channel, sets the Nacho workspace to `America/New_York`, and creates `phone_call_logs`.

## Environment variables

Copy `.env.example` to `.env.local` and configure server secrets in Vercel.

### Supabase

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### SMS / Text (primary)

```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
```

Inbound SMS webhook:

`POST https://YOUR-GARAGE-OS.vercel.app/api/webhooks/sms`

Outbound message API:

```json
POST /api/messages/send
{
  "channel": "sms",
  "to": "+1610XXXXXXX",
  "body": "Your message"
}
```

### Instagram

```env
META_VERIFY_TOKEN=
META_APP_SECRET=
META_GRAPH_VERSION=v23.0
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_ACCOUNT_ID=
```

Instagram webhook:

`https://YOUR-GARAGE-OS.vercel.app/api/webhooks/instagram`

Outbound:

```json
POST /api/messages/send
{
  "channel": "instagram",
  "to": "INSTAGRAM_SCOPED_USER_ID",
  "body": "Your message"
}
```

Meta permissions / review are still required before using customer accounts in production.

### Optional WhatsApp

The prior WhatsApp backend remains available for future use but is no longer surfaced as a primary Nacho's Legacy channel.

## Landing / Website Intake

Endpoint:

`POST /api/intake/nachos`

Recommended flow:

`Instagram / Google / Website → Landing → Photo upload → Intake API → Contact → Vehicle → Collision Case → Lead → Estimate → Repair Board`

The landing uploads photos first to Cloudinary or Supabase Storage and then sends the resulting URLs to Garage OS.

Example payload:

```json
{
  "name": "Maria Rodriguez",
  "phone": "+16105551234",
  "email": "maria@email.com",
  "preferredLanguage": "en",
  "intakeType": "collision",
  "vehicle": { "year": 2022, "make": "Honda", "model": "Accord" },
  "drivable": true,
  "damageArea": "Rear",
  "description": "Rear-end collision",
  "insuranceCompany": "GEICO",
  "hasClaim": true,
  "claimNumber": "G-123456",
  "photos": [{ "url": "https://.../photo1.jpg" }],
  "attribution": {
    "source": "instagram",
    "medium": "bio",
    "landing": "landingnachoslegacy",
    "utm_source": "instagram",
    "utm_medium": "bio"
  }
}
```

## Language

The top-bar switch changes the full app between **EN / ES** and stores the preference. The selected language is also used by exports and can be passed to Legacy Intelligence.

## Safety / operational rules

- Estimates and pricing require human approval.
- AI damage observations are suggestions, not final diagnoses.
- Original customer messages are preserved when translations are used.
- Service-role and messaging tokens stay server-side only.
- Public intake should use rate limiting and CAPTCHA/Turnstile before full-scale launch.
