# SendGrid mailer

Sends Webiny's mail through [SendGrid](https://sendgrid.com): password reset codes, workflow
notifications and the test email from the Mailer settings screen.

It calls SendGrid's v3 Mail Send API with `fetch`, so it adds no dependencies to the project.

## Requirements

- Webiny 6.6.0 or newer.
- A verified Sender Identity in SendGrid: a single sender or an authenticated domain.
- A SendGrid API key with the "Mail Send" permission.

## Setup

1. In `webiny.config.tsx`, render `<SendGridMailer />` in place of `<MailerSmtp />`. Installing
   the extension adds `<SendGridMailer />`; remove `<MailerSmtp />` and its import yourself. If you
   keep both, SendGrid is used while it is configured and SMTP is the fallback.

2. Set the API key and the sender. The sender must be a verified Sender Identity:

   ```
   WEBINY_API_SENDGRID_API_KEY=SG....
   WEBINY_API_SENDGRID_FROM="Webiny <no-reply@example.com>"
   ```

3. Deploy the API (`yarn webiny deploy api`). The deploy passes both variables to the API
   functions.

4. In the Admin app, open Settings > Mailer and send a test email. A wrong key or an unverified
   sender only shows up when SendGrid is called, so this is the way to check the setup.

## Environment variables

| Variable                       | Required | Description                                                             |
| ------------------------------ | -------- | ----------------------------------------------------------------------- |
| `WEBINY_API_SENDGRID_API_KEY`  | Yes      | SendGrid API key with the "Mail Send" permission.                       |
| `WEBINY_API_SENDGRID_FROM`     | Yes      | Sender, e.g. `no-reply@example.com` or `Webiny <no-reply@example.com>`. |
| `WEBINY_API_SENDGRID_REPLY_TO` | No       | Reply-to address for mail sent without one.                             |

Variables prefixed with `WEBINY_` are passed to the API functions on deploy, so setting them in the
shell or in the project's `.env` file is enough. They are read when mail is sent, so the API key
never goes into the build. It does end up in the functions' environment configuration, so use a key
restricted to "Mail Send".

## Workflow notifications

Workflow notifications are sent with all recipients in BCC and no `to`. SendGrid requires a `to`,
so the extension addresses those messages to the sender's own address. The sender mailbox receives
a copy of each notification.

## Limitations

- One sender per deployment. It comes from the environment, not from the Mailer settings screen.
- Attachments are not supported. Webiny's mailer sends text and HTML bodies only.
- SendGrid answers 202 when it accepts a message. Delivery problems show up later, in SendGrid's
  activity feed and event webhooks.
