---
name: webiny-mailer-providers
description: >
  Use when sending Webiny's email through Resend, SendGrid or Amazon SES instead of SMTP, or when
  choosing a mail provider. Triggers on: "use Resend", "use SendGrid", "use SES", "Amazon SES",
  "replace SMTP", "mail provider", "MailerResend", "MailerSendGrid", "MailerSes".
---

# Mail providers: Resend, SendGrid, Amazon SES

## TL;DR

Webiny sends its mail (password reset codes, workflow notifications, the test email) through one
mail transport. New projects render `<MailerSmtp />` in `webiny.config.tsx`. To use another
provider, install its package and replace `<MailerSmtp />` with its component. Each provider is
configured with environment variables that the API reads when it sends mail, so API keys never go
into the build.

| Provider   | Package                   | Component            |
| ---------- | ------------------------- | -------------------- |
| SMTP       | `@webiny/mailer-smtp`     | `<MailerSmtp />`     |
| Resend     | `@webiny/mailer-resend`   | `<MailerResend />`   |
| SendGrid   | `@webiny/mailer-sendgrid` | `<MailerSendGrid />` |
| Amazon SES | `@webiny/mailer-ses`      | `<MailerSes />`      |

## Core pattern (`webiny.config.tsx`)

```tsx
import { MailerResend } from "@webiny/mailer-resend";

export const Extensions = () => {
  return (
    <>
      {/* ... other extensions ... */}
      <MailerResend />
    </>
  );
};
```

Remove `<MailerSmtp />` when you add another provider. If both are rendered, the one rendered last
is used while it is configured, and the other is the fallback.

## Environment variables

Variables prefixed with `WEBINY_` are passed to the API functions on deploy, so setting them in the
shell or in the project's `.env` file is enough.

### Resend

| Variable                     | Required | Description                                                             |
| ---------------------------- | -------- | ----------------------------------------------------------------------- |
| `WEBINY_API_RESEND_API_KEY`  | Yes      | Resend API key. A key with "Sending access" is enough.                  |
| `WEBINY_API_RESEND_FROM`     | Yes      | Sender, e.g. `no-reply@example.com` or `Webiny <no-reply@example.com>`. |
| `WEBINY_API_RESEND_REPLY_TO` | No       | Reply-to address for mail sent without one.                             |

The sender must be on a domain verified in Resend.

### SendGrid

| Variable                       | Required | Description                                                             |
| ------------------------------ | -------- | ----------------------------------------------------------------------- |
| `WEBINY_API_SENDGRID_API_KEY`  | Yes      | SendGrid API key with the "Mail Send" permission.                       |
| `WEBINY_API_SENDGRID_FROM`     | Yes      | Sender, e.g. `no-reply@example.com` or `Webiny <no-reply@example.com>`. |
| `WEBINY_API_SENDGRID_REPLY_TO` | No       | Reply-to address for mail sent without one.                             |

The sender must be a verified Sender Identity in SendGrid.

### Amazon SES

| Variable                           | Required | Description                                                             |
| ---------------------------------- | -------- | ----------------------------------------------------------------------- |
| `WEBINY_API_SES_FROM`              | Yes      | Sender, e.g. `no-reply@example.com` or `Webiny <no-reply@example.com>`. |
| `WEBINY_API_SES_REGION`            | No       | SES region. Defaults to the region the API runs in.                     |
| `WEBINY_API_SES_REPLY_TO`          | No       | Reply-to address for mail sent without one.                             |
| `WEBINY_API_SES_CONFIGURATION_SET` | No       | SES configuration set, for bounce, complaint and delivery tracking.     |

No credentials: on AWS, the deploy adds an `ses:SendEmail` policy for the sender to the API
functions' IAM role. In a standalone project, the AWS SDK's default credential chain is used
(`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`, a profile, an instance role). The sender must be
a verified SES identity, and the account needs SES production access to mail unverified addresses.

## Checking the setup

Deploy the API, then open Settings > Mailer in the Admin app and send a test email. A wrong key, an
unverified sender or a missing permission only shows up when the provider is called.

## Common mistakes

| Mistake                                         | Fix                                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------------------- |
| Both `<MailerSmtp />` and the provider rendered | Remove `<MailerSmtp />` unless you want SMTP as a fallback                      |
| Test email says no transport is configured      | Set the provider's required variables and redeploy the API                      |
| BCC-only mail arrives in the sender's inbox     | Expected for Resend and SendGrid: they require `to`, so it is set to the sender |

## Related skills

- `webiny-mailer-smtp` — SMTP settings in code or in the Admin app
