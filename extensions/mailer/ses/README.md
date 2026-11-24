# Amazon SES mailer

Sends Webiny's mail through Amazon SES: password reset codes, workflow notifications and the test
email from the Mailer settings screen.

On AWS there are no credentials to store. The API functions already run under an IAM role, the
extension adds `ses:SendEmail` to that role, and the AWS SDK picks up the role's temporary
credentials on its own. Nothing secret goes into settings, environment variables or the build.

## Requirements

- Webiny 6.6.0 or newer.
- A sender identity verified in SES, in the region you send from: a domain (DKIM records in DNS)
  or a single email address.
- SES production access for that region. In the SES sandbox, mail only goes to verified
  addresses, so a password reset for a normal user fails until AWS approves production access.

## Setup

1. In `webiny.config.tsx`, render `<SesMailer />` in place of `<MailerSmtp />`. Installing the
   extension adds `<SesMailer />` and the `@aws-sdk/client-sesv2` dependency; remove
   `<MailerSmtp />` and its import yourself. If you keep both, SES is used while it is configured
   and SMTP is the fallback.

2. Set the sender. It must belong to the verified identity:

   ```
   WEBINY_API_SES_FROM="Webiny <no-reply@example.com>"
   ```

3. Deploy the API (`yarn webiny deploy api`). The deploy adds the `api-ses-send-email` policy to
   the API functions' role and passes the variable to the functions.

4. In the Admin app, open Settings > Mailer and send a test email. A missing permission or an
   unverified sender only shows up when SES is called, so this is the way to check the setup.

## Environment variables

| Variable                           | Required | Description                                                             |
| ---------------------------------- | -------- | ----------------------------------------------------------------------- |
| `WEBINY_API_SES_FROM`              | Yes      | Sender, e.g. `no-reply@example.com` or `Webiny <no-reply@example.com>`. |
| `WEBINY_API_SES_REGION`            | No       | SES region. Defaults to the region the API is deployed to.              |
| `WEBINY_API_SES_REPLY_TO`          | No       | Reply-to address for mail sent without one.                             |
| `WEBINY_API_SES_CONFIGURATION_SET` | No       | SES configuration set, for bounce, complaint and delivery tracking.     |

Variables prefixed with `WEBINY_` are passed to the API functions on deploy, so setting them in the
shell or in the project's `.env` file is enough. The Pulumi program reads the same variables to
scope the IAM policy, so change them and redeploy together.

## What the IAM policy allows

`ses:SendEmail` on:

- `identity/<domain of the sender>` and `identity/<sender address>`. SES checks the domain identity
  when the domain is verified and the address identity when only the address is, so both are
  listed.
- `configuration-set/<name>`, when `WEBINY_API_SES_CONFIGURATION_SET` is set.

The policy is attached to the GraphQL function's role. The streaming GraphQL function, background
tasks and the scheduler share that role, so mail sent from any of them is covered.

## Standalone projects

A standalone project has no Pulumi, so the extension skips the IAM policy there. The AWS SDK uses
its default credential chain instead: `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`, a profile,
or an instance role. Those credentials need `ses:SendEmail` on the sender's identity.

## Limitations

- One sender per deployment. It comes from the environment, not from the Mailer settings screen.
- Attachments are not supported. Webiny's mailer sends text and HTML bodies only.
