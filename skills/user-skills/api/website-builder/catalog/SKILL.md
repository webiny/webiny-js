---
name: webiny-api-website-builder-catalog
context: webiny-api
description: >
  API — Website Builder — 49 abstractions.
  Page and redirect event handlers and use cases.
---

# API — Website Builder

Page and redirect event handlers and use cases.

## How to Use

1. Find the abstraction you need in the table below
2. Read the source file to get the exact interface and types
3. Import: `import { ClassName } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

| Class | Import | Source |
|-------|--------|--------|
| `CreatePageRevisionFromUseCase` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/abstractions.ts` |
| `CreatePageUseCase` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/CreatePage/abstractions.ts` |
| `CreateRedirectUseCase` | `webiny/api/website-builder/redirect` | `@webiny/api-website-builder/features/redirects/CreateRedirect/abstractions.ts` |
| `DeletePageUseCase` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/DeletePage/abstractions.ts` |
| `DeleteRedirectUseCase` | `webiny/api/website-builder/redirect` | `@webiny/api-website-builder/features/redirects/DeleteRedirect/abstractions.ts` |
| `DuplicatePageUseCase` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/DuplicatePage/abstractions.ts` |
| `GetActiveRedirectsUseCase` | `webiny/api/website-builder/redirect` | `@webiny/api-website-builder/features/redirects/GetActiveRedirects/abstractions.ts` |
| `GetPageByIdUseCase` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/GetPageById/abstractions.ts` |
| `GetPageByPathUseCase` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/GetPageByPath/abstractions.ts` |
| `GetPageRevisionsUseCase` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/GetPageRevisions/abstractions.ts` |
| `GetRedirectByIdUseCase` | `webiny/api/website-builder/redirect` | `@webiny/api-website-builder/features/redirects/GetRedirectById/abstractions.ts` |
| `InvalidateRedirectsCacheUseCase` | `webiny/api/website-builder/redirect` | `@webiny/api-website-builder/features/redirects/InvalidateRedirectsCache/abstractions.ts` |
| `ListPagesUseCase` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/ListPages/abstractions.ts` |
| `ListRedirectsUseCase` | `webiny/api/website-builder/redirect` | `@webiny/api-website-builder/features/redirects/ListRedirects/abstractions.ts` |
| `MovePageUseCase` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/MovePage/abstractions.ts` |
| `MoveRedirectUseCase` | `webiny/api/website-builder/redirect` | `@webiny/api-website-builder/features/redirects/MoveRedirect/abstractions.ts` |
| `NextjsConfig` | `webiny/api/website-builder/nextjs` | `@webiny/api-website-builder/features/nextjs/abstractions.ts` |
| `PageAfterCreateEventHandler` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/CreatePage/abstractions.ts` |
| `PageAfterCreateRevisionFromEventHandler` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/abstractions.ts` |
| `PageAfterDeleteEventHandler` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/DeletePage/abstractions.ts` |
| `PageAfterDuplicateEventHandler` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/DuplicatePage/abstractions.ts` |
| `PageAfterMoveEventHandler` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/MovePage/abstractions.ts` |
| `PageAfterPublishEventHandler` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/PublishPage/abstractions.ts` |
| `PageAfterUnpublishEventHandler` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/UnpublishPage/abstractions.ts` |
| `PageAfterUpdateEventHandler` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/UpdatePage/abstractions.ts` |
| `PageBeforeCreateEventHandler` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/CreatePage/abstractions.ts` |
| `PageBeforeCreateRevisionFromEventHandler` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/abstractions.ts` |
| `PageBeforeDeleteEventHandler` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/DeletePage/abstractions.ts` |
| `PageBeforeDuplicateEventHandler` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/DuplicatePage/abstractions.ts` |
| `PageBeforeMoveEventHandler` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/MovePage/abstractions.ts` |
| `PageBeforePublishEventHandler` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/PublishPage/abstractions.ts` |
| `PageBeforeUnpublishEventHandler` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/UnpublishPage/abstractions.ts` |
| `PageBeforeUpdateEventHandler` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/UpdatePage/abstractions.ts` |
| `PublishPageUseCase` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/PublishPage/abstractions.ts` |
| `RedirectAfterCreateEventHandler` | `webiny/api/website-builder/redirect` | `@webiny/api-website-builder/features/redirects/CreateRedirect/abstractions.ts` |
| `RedirectAfterDeleteEventHandler` | `webiny/api/website-builder/redirect` | `@webiny/api-website-builder/features/redirects/DeleteRedirect/abstractions.ts` |
| `RedirectAfterMoveEventHandler` | `webiny/api/website-builder/redirect` | `@webiny/api-website-builder/features/redirects/MoveRedirect/abstractions.ts` |
| `RedirectAfterUpdateEventHandler` | `webiny/api/website-builder/redirect` | `@webiny/api-website-builder/features/redirects/UpdateRedirect/abstractions.ts` |
| `RedirectBeforeCreateEventHandler` | `webiny/api/website-builder/redirect` | `@webiny/api-website-builder/features/redirects/CreateRedirect/abstractions.ts` |
| `RedirectBeforeDeleteEventHandler` | `webiny/api/website-builder/redirect` | `@webiny/api-website-builder/features/redirects/DeleteRedirect/abstractions.ts` |
| `RedirectBeforeMoveEventHandler` | `webiny/api/website-builder/redirect` | `@webiny/api-website-builder/features/redirects/MoveRedirect/abstractions.ts` |
| `RedirectBeforeUpdateEventHandler` | `webiny/api/website-builder/redirect` | `@webiny/api-website-builder/features/redirects/UpdateRedirect/abstractions.ts` |
| `SchedulePublishPageUseCase` | `webiny/api/website-builder/scheduler` | `@webiny/api-website-builder-scheduler/features/SchedulePublishPageUseCase/abstractions.ts` |
| `SchedulePublishRedirectUseCase` | `webiny/api/website-builder/scheduler` | `@webiny/api-website-builder-scheduler/features/SchedulePublishRedirectUseCase/abstractions.ts` |
| `ScheduleUnpublishPageUseCase` | `webiny/api/website-builder/scheduler` | `@webiny/api-website-builder-scheduler/features/ScheduleUnpublishPageUseCase/abstractions.ts` |
| `ScheduleUnpublishRedirectUseCase` | `webiny/api/website-builder/scheduler` | `@webiny/api-website-builder-scheduler/features/ScheduleUnpublishRedirectUseCase/abstractions.ts` |
| `UnpublishPageUseCase` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/UnpublishPage/abstractions.ts` |
| `UpdatePageUseCase` | `webiny/api/website-builder/page` | `@webiny/api-website-builder/features/pages/UpdatePage/abstractions.ts` |
| `UpdateRedirectUseCase` | `webiny/api/website-builder/redirect` | `@webiny/api-website-builder/features/redirects/UpdateRedirect/abstractions.ts` |
