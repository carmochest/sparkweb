# Spark Play Museum — Website

Static frontend for [Spark Play Museum], built from the project specbook.
Playful, family-friendly, mobile-responsive, and SEO-friendly — ready to
deploy on Railway (or any static host) and wire into Medusa.js, Sanity,
and Odoo per the spec.

## Pages

| File | Spec page |
|---|---|
| `index.html` | About Us (home) |
| `plan-your-visit.html` | Plan Your Visit + FAQ |
| `tickets.html` | Ticket & Membership + Build Your Visit flow |
| `programs.html` | Playgroup & Other Programs |
| `parties.html` | Private Birthday Party |
| `field-trips.html` | School & Community (Field Trip) |
| `events.html` | Events & Seasonal Installations |
| `sponsorship.html` | Sponsorship & CSR Opportunities |
| `terms.html` | Terms & Conditions / Privacy Policy |

## Build Your Visit (tickets page)

Implements the spec's date-first booking flow:
1. Customer selects a **visit date** (weekday/weekend pricing, 7% VAT noted)
2. **Add-on events available for that date** are shown
3. Everything joins **one cart → one combined checkout**

Pricing and events in `js/main.js` are sample data — replace with live
data from Medusa/Odoo when the backend is connected.

## Editing pages

Shared header/footer live in `_partials/`; page content lives in `_pages/`.
After editing, regenerate the root HTML files:

```
python3 build.py
```

The generated root `*.html` files are committed so the site deploys as
plain static files with no build step required on the server.

## Still to come (per spec)

- Zone details, "how long can we stay" FAQ (client to send by 7 Aug)
- Real payment gateway (Stripe / Omise / 2C2P) + PromptPay QR
- Medusa.js backend, Sanity CMS, Odoo ERP sync, Resend email
- Photography, final pricing, phone number, careers page
