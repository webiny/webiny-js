# Resend mailer

Sends Webiny's mail through [Resend](https://resend.com): password reset codes, workflow
notifications and the test email from the Mailer settings screen.

It calls Resend's HTTP API with `fetch`, so it adds no dependencies to the project.

## Requirements

- Webiny 6.6.0 or newer.
- A domain verified in Resend. Until one is, Resend only sends from `onboarding@resend.dev` and
  only to the address of your Resend account.
- A Resend API key. A key with "Sending access" is enough.

## Setup

1. In `webiny.config.tsx`, render `<ResendMailer />` in place of `<MailerSmtp />`. Installing the
   extension adds `<ResendMailer />`; remove `<MailerSmtp />` and its import yourself. If you keep
   both, Resend is used while it is configured and SMTP is the fallback.

2. Set the API key and the sender. The sender must be on the verified domain:

   ```
   WEBINY_API_RESEND_API_KEY=re_...
   WEBINY_API_RESEND_FROM="Webiny <no-reply@example.com>"
   ```

3. Deploy the API (`yarn webiny deploy api`). The deploy passes both variables to the API
   functions.

4. In the Admin app, open Settings > Mailer and send a test email. A wrong key or an unverified
   domain only shows up when Resend is called, so this is the way to check the setup.

## Environment variables

| Variable                     | Required | Description                                                             |
| ---------------------------- | -------- | ----------------------------------------------------------------------- |
| `WEBINY_API_RESEND_API_KEY`  | Yes      | Resend API key.                                                         |
| `WEBINY_API_RESEND_FROM`     | Yes      | Sender, e.g. `no-reply@example.com` or `Webiny <no-reply@example.com>`. |
| `WEBINY_API_RESEND_REPLY_TO` | No       | Reply-to address for mail sent without one.                             |

Variables prefixed with `WEBINY_` are passed to the API functions on deploy, so setting them in the
shell or in the project's `.env` file is enough. They are read when mail is sent, so the API key
never goes into the build. It does end up in the functions' environment configuration, readable by
anyone who can read the Lambda configuration in your AWS account. Use a key with sending access
only, so a leaked key cannot read or change anything else in Resend.

## Workflow notifications

Workflow notifications are sent with all recipients in BCC and no `to`. Resend requires `to`, so
the extension addresses those messages to the sender's own address. The sender mailbox receives a
copy of each notification.

## Limitations

- One sender per deployment. It comes from the environment, not from the Mailer settings screen.
- Attachments are not supported. Webiny's mailer sends text and HTML bodies only.
- A message that Resend accepts can still bounce later. Resend's dashboard and webhooks show
  bounces and complaints.
