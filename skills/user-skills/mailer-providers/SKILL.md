---
name: webiny-mailer-providers
description: >
  Use when sending Webiny's email through Resend, SendGrid or Amazon SES instead of SMTP, when
  choosing a mail provider, or when writing a custom mail transport. Triggers on: "use Resend",
  "use SendGrid", "use SES", "Amazon SES", "replace SMTP", "mail provider", "custom transport",
  "ResendMailer", "SendGridMailer", "SesMailer", "MailTransportFactory".
---

# Mail providers: Resend, SendGrid, Amazon SES

## TL;DR

Webiny sends its mail (password reset codes, workflow notifications, the test email) through one
mail transport. SMTP is built in. Resend, SendGrid and Amazon SES are extensions: install one with
the CLI and set its environment variables. While the provider is configured, it is used instead of
SMTP. Each is configured with environment variables that the API reads when it sends mail, so API keys never go
into the build.

| Provider   | Install                                 | Component            |
| ---------- | --------------------------------------- | -------------------- |
| SMTP       | built in                                | none                 |
| Resend     | `yarn webiny extension mailer/resend`   | `<ResendMailer />`   |
| SendGrid   | `yarn webiny extension mailer/sendgrid` | `<SendGridMailer />` |
| Amazon SES | `yarn webiny extension mailer/ses`      | `<SesMailer />`      |

Installing copies the source into `extensions/mailer/<provider>/` and adds the component to
`webiny.config.tsx`. The code is the project's own from then on: it can be read and changed.

## Using a provider instead of SMTP (`webiny.config.tsx`)

```tsx
// Added by `yarn webiny extension mailer/resend`
import { ResendMailer } from "./extensions/mailer/resend/ResendMailer.js";
<ResendMailer />;
```

Nothing has to be removed. The provider is used while its required variables are set; without
them, mail goes over SMTP. The SMTP form stays on the Settings > Mailer screen.

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

## Writing your own transport

A transport is an API extension that registers a `MailTransportFactory`. `createTransport()` reads
the transport's configuration and returns a `MailTransport`, or `null` when it is not configured.
The last registered factory that returns a transport is used.

```ts
// extensions/mailer/myProvider/api/MyMailTransportFactory.ts
import { MailTransport, MailTransportFactory } from "webiny/api/mailer";

class MyMailTransport implements MailTransport.Interface {
  public readonly name = "Mailer/MyTransport";

  async send(params: MailTransport.SendParams) {
    // Call the provider. Return { result, error: null } or { result: null, error }.
    return { result: null, error: null };
  }
}

class MyMailTransportFactory implements MailTransportFactory.Interface {
  public readonly name = "Mailer/MyTransport";

  async createTransport(): MailTransportFactory.Return {
    if (!process.env.WEBINY_API_MY_PROVIDER_KEY) {
      return null;
    }
    return new MyMailTransport();
  }
}

export default MailTransportFactory.createImplementation({
  implementation: MyMailTransportFactory,
  dependencies: []
});
```

Register it in `webiny.config.tsx` with
`<Api.Extension src={"/extensions/mailer/myProvider/api/MyMailTransportFactory.ts"} />`. The
Resend, SendGrid and SES extensions are complete examples.

## Checking the setup

Deploy the API, then open Settings > Mailer in the Admin app and send a test email. A wrong key, an
unverified sender or a missing permission only shows up when the provider is called.

## Common mistakes

| Mistake                                     | Fix                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------- |
| Test email says no transport is configured  | Set the provider's required variables and redeploy the API                      |
| BCC-only mail arrives in the sender's inbox | Expected for Resend and SendGrid: they require `to`, so it is set to the sender |

## Related skills

- `webiny-mailer-smtp` — SMTP settings in code or in the Admin app
