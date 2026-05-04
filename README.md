# RealMaria Private Content Landing Page

Static subscription landing page with plan selection, Gmail validation, and PayPal/USDT payment prompts.

## Backend email notifications

This project now includes a Node backend that sends checkout details to your email address instead of opening the user's mail client.

1. Copy `.env.example` to `.env`
2. Fill in your SMTP credentials and owner email
3. Run `npm install`
4. Start the server with `npm start`
5. Open the site at `http://localhost:3000`

The frontend will POST checkout state and transaction IDs to `http://localhost:3000/send-email`.

### SendGrid setup

If you want to use SendGrid for SMTP delivery, set your `.env` values like this:

- `SMTP_HOST=smtp.sendgrid.net`
- `SMTP_PORT=587`
- `SMTP_USER=apikey`
- `SMTP_PASS=<your-sendgrid-api-key>`

For authenticated delivery on your domain, add these DNS records in your DNS provider:

- `CNAME em972.realmaria.vercel.app` → `u106726906.wl157.sendgrid.net`
- `CNAME s1._domainkey.realmaria.vercel.app` → `s1.domainkey.u106726906.wl157.sendgrid.net`
- `CNAME s2._domainkey.realmaria.vercel.app` → `s2.domainkey.u106726906.wl157.sendgrid.net`
- `TXT _dmarc.realmaria.vercel.app` → `v=DMARC1; p=none`

Then restart your backend with `npm start`.

## Publish

This site is ready for GitHub Pages. Use `main` as the branch and `/root` as the Pages source.
