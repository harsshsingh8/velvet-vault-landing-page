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

## Publish

This site is ready for GitHub Pages. Use `main` as the branch and `/root` as the Pages source.
