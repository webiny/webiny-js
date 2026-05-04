---
name: webiny-api-mailer-catalog
context: webiny-api
description: >
  api/mailer — 11 abstractions.
---

# api/mailer

## How to Use

1. Find the abstraction you need below
2. You MUST read the source file to get the exact interface and types!
3. Import: `import { Name } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---

**Name:** `GetSettingsRepository`
**Import:** `import { GetSettingsRepository } from "webiny/api/mailer"`
**Source:** `@webiny/api-mailer/features/GetSettings/index.ts`

---

**Name:** `GetSettingsUseCase`
**Import:** `import { GetSettingsUseCase } from "webiny/api/mailer"`
**Source:** `@webiny/api-mailer/features/GetSettings/index.ts`

---

**Name:** `MailAfterSendEventHandler`
**Import:** `import { MailAfterSendEventHandler } from "webiny/api/mailer"`
**Source:** `@webiny/api-mailer/features/SendMail/index.ts`

---

**Name:** `MailBeforeSendEventHandler`
**Import:** `import { MailBeforeSendEventHandler } from "webiny/api/mailer"`
**Source:** `@webiny/api-mailer/features/SendMail/index.ts`

---

**Name:** `MailerService`
**Import:** `import { MailerService } from "webiny/api/mailer"`
**Source:** `@webiny/api-mailer/domain/MailerService/abstractions.ts`

---

**Name:** `MailerSettingsAfterSaveEventHandler`
**Import:** `import { MailerSettingsAfterSaveEventHandler } from "webiny/api/mailer"`
**Source:** `@webiny/api-mailer/features/SaveSettings/index.ts`

---

**Name:** `MailerSettingsBeforeSaveEventHandler`
**Import:** `import { MailerSettingsBeforeSaveEventHandler } from "webiny/api/mailer"`
**Source:** `@webiny/api-mailer/features/SaveSettings/index.ts`

---

**Name:** `MailSendErrorEventHandler`
**Import:** `import { MailSendErrorEventHandler } from "webiny/api/mailer"`
**Source:** `@webiny/api-mailer/features/SendMail/index.ts`

---

**Name:** `SaveSettingsRepository`
**Import:** `import { SaveSettingsRepository } from "webiny/api/mailer"`
**Source:** `@webiny/api-mailer/features/SaveSettings/index.ts`

---

**Name:** `SaveSettingsUseCase`
**Import:** `import { SaveSettingsUseCase } from "webiny/api/mailer"`
**Source:** `@webiny/api-mailer/features/SaveSettings/index.ts`

---

**Name:** `SendMailUseCase`
**Import:** `import { SendMailUseCase } from "webiny/api/mailer"`
**Source:** `@webiny/api-mailer/features/SendMail/index.ts`

---
