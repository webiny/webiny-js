---
name: webiny-mailer-smtp
description: >
  Use when configuring SMTP email/mailer settings in a Webiny project.
  Triggers on: "configure email", "set up SMTP", "mailer config", "sending emails",
  "email not working", "configure mailer", "SMTP password", "Api.Mailer.Smtp".
---

# Mailer SMTP Configuration

## TL;DR

Add `<Api.Mailer.Smtp ... />` to your `webiny.config.tsx` to configure SMTP email delivery at build time. The component serializes the settings into the build artifact — always pass the password via an environment variable, never hard-code it. Deploy the API after making changes.

## Core Pattern

```tsx
import { Api } from "@webiny/project-aws/api";

<Api.Mailer.Smtp
    host={"smtp.example.com"}
    port={587}
    user={"smtp-user"}
    password={process.env.SMTP_PASSWORD || "unknown"}
    from={"noreply@example.com"}
    replyTo={"support@example.com"}   {/* optional */}
/>
```

Place this inside the JSX returned by your config component in `webiny.config.tsx`, alongside other `<Api.*>` extensions.

## Props Reference

| Prop      | Type     | Required | Description |
|-----------|----------|----------|-------------|
| `host`    | `string` | Yes      | SMTP server hostname |
| `port`    | `number` | Yes      | SMTP server port (positive integer) |
| `user`    | `string` | Yes      | SMTP authentication username |
| `password`| `string` | Yes      | SMTP authentication password — **use env var** |
| `from`    | `string` | Yes      | Default sender address |
| `replyTo` | `string` | No       | Default reply-to address |

`from` and `replyTo` are validated by the [`email-addresses`](https://www.npmjs.com/package/email-addresses) package against RFC 5322.

## Full Example (`webiny.config.tsx`)

```tsx
import React from "react";
import { Api, Admin, Core } from "@webiny/project-aws/api";

const MyConfig = () => {
    return (
        <>
            {/* ... other extensions ... */}

            {/* Mailer: configure SMTP transport via code */}
            <Api.Mailer.Smtp
                host={"smtp.sendgrid.net"}
                port={587}
                user={"apikey"}
                password={process.env.SENDGRID_API_KEY || "unknown"}
                from={"noreply@acme.com"}
                replyTo={"support@acme.com"}
            />
        </>
    );
};
```

Add `SENDGRID_API_KEY=your-secret` to your `.env` file (never commit it).

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Hard-coding the password | Use `process.env.SMTP_PASSWORD \|\| "unknown"` |
| `process.env.SMTP_PASSWORD` undefined at build time → "expected string, received object" error | Add a fallback: `\|\| "unknown"` or assert with `!` |
| `from`/`replyTo` value fails validation | Must be a valid RFC 5322 mailbox address |
| Settings not taking effect | Run `yarn webiny deploy api` after editing `webiny.config.tsx` |

## Quick Reference

```bash
# After editing webiny.config.tsx, deploy the API
yarn webiny deploy api
```

```ts
// Environment variable in .env
SMTP_PASSWORD=your-smtp-password-here
```

## Related Skills

- `webiny-project-structure` — Where `webiny.config.tsx` lives and how extensions are structured
- `webiny-local-development` — Running and deploying locally
