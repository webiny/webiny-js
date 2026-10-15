# Phase 7 — user answers (2026-10-15)

- Q1 Events: notify only the D44 rows plus the take-over notice (D111). Requested, intermediate approve, pool Start and restarted send nothing.
- Q2 Opt-out (D111): only the per-action `notifyPreviousOwner` flag on take-over (default true), carried on the take-over fact and exposed in the CMS/WB wrappers and GraphQL. No stored per-user setting.
- Q3 E-mail links: the admin URL is available through service discovery; e-mails include a link to the review in the admin.
- Q4 Websocket contract: one action with the event in `data` ({ event, reviewId, stepId, namespace, ... }), sent only to recipients.
- Other research questions: controller takes the research recommendations unless noted (see notes.md).
- Q3 detail: admin host comes from `ServiceDiscovery.load()` (`@webiny/api-core/features/serviceDiscovery/index.js`), `manifest.admin.cloudfront.domain` (precedent: packages/api-website-builder/src/features/nextjs/NextjsConfig.ts getDomains). No manifest or no admin entry → the e-mail goes without a link (never fails the notification).
- Q5 Mail sender (2026-10-15): api-mailer defaults `from` to the configured mailer settings `from` when the caller passes none (SMTP transport or its factory). Fixes every caller; workflows' mail transport keeps sending without `from`.
