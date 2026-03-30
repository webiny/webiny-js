---
name: webiny-api-website-builder-catalog
context: webiny-api
description: >
  API — Website Builder — 57 abstractions.
  Page and redirect event handlers and use cases.
---

# API — Website Builder

Page and redirect event handlers and use cases.

## How to Use

1. Find the abstraction you need below
2. Read the source file to get the exact interface and types
3. Import: `import { Name } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---

**Name:** `CreatePageRevisionFromUseCase`
**Import:** `import { CreatePageRevisionFromUseCase } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/abstractions.ts`
**Description:** Create a page revision from an existing one.

---

**Name:** `CreatePageUseCase`
**Import:** `import { CreatePageUseCase } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/CreatePage/abstractions.ts`
**Description:** Create a new page.

---

**Name:** `CreateRedirectUseCase`
**Import:** `import { CreateRedirectUseCase } from "webiny/api/website-builder/redirect"`
**Source:** `@webiny/api-website-builder/features/redirects/CreateRedirect/abstractions.ts`
**Description:** Create a URL redirect.

---

**Name:** `DeletePageUseCase`
**Import:** `import { DeletePageUseCase } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/DeletePage/abstractions.ts`
**Description:** Delete a page.

---

**Name:** `DeleteRedirectUseCase`
**Import:** `import { DeleteRedirectUseCase } from "webiny/api/website-builder/redirect"`
**Source:** `@webiny/api-website-builder/features/redirects/DeleteRedirect/abstractions.ts`
**Description:** Delete a URL redirect.

---

**Name:** `DuplicatePageUseCase`
**Import:** `import { DuplicatePageUseCase } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/DuplicatePage/abstractions.ts`
**Description:** Duplicate a page.

---

**Name:** `GetActiveRedirectsUseCase`
**Import:** `import { GetActiveRedirectsUseCase } from "webiny/api/website-builder/redirect"`
**Source:** `@webiny/api-website-builder/features/redirects/GetActiveRedirects/abstractions.ts`
**Description:** Retrieve all active URL redirects.

---

**Name:** `GetDeletedPageByIdUseCase`
**Import:** `import { GetDeletedPageByIdUseCase } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/GetDeletedPageById/abstractions.ts`

---

**Name:** `GetPageByIdUseCase`
**Import:** `import { GetPageByIdUseCase } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/GetPageById/abstractions.ts`
**Description:** Retrieve a page by ID.

---

**Name:** `GetPageByPathUseCase`
**Import:** `import { GetPageByPathUseCase } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/GetPageByPath/abstractions.ts`
**Description:** Retrieve a page by its URL path.

---

**Name:** `GetPageRevisionsUseCase`
**Import:** `import { GetPageRevisionsUseCase } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/GetPageRevisions/abstractions.ts`
**Description:** Retrieve all revisions of a page.

---

**Name:** `GetRedirectByIdUseCase`
**Import:** `import { GetRedirectByIdUseCase } from "webiny/api/website-builder/redirect"`
**Source:** `@webiny/api-website-builder/features/redirects/GetRedirectById/abstractions.ts`
**Description:** Retrieve a URL redirect by ID.

---

**Name:** `InvalidateRedirectsCacheUseCase`
**Import:** `import { InvalidateRedirectsCacheUseCase } from "webiny/api/website-builder/redirect"`
**Source:** `@webiny/api-website-builder/features/redirects/InvalidateRedirectsCache/abstractions.ts`
**Description:** Invalidate the redirects cache.

---

**Name:** `ListDeletedPagesUseCase`
**Import:** `import { ListDeletedPagesUseCase } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/ListDeletedPages/abstractions.ts`

---

**Name:** `ListPagesUseCase`
**Import:** `import { ListPagesUseCase } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/ListPages/abstractions.ts`
**Description:** List pages with filtering and pagination.

---

**Name:** `ListRedirectsUseCase`
**Import:** `import { ListRedirectsUseCase } from "webiny/api/website-builder/redirect"`
**Source:** `@webiny/api-website-builder/features/redirects/ListRedirects/abstractions.ts`
**Description:** List URL redirects with filtering.

---

**Name:** `MovePageUseCase`
**Import:** `import { MovePageUseCase } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/MovePage/abstractions.ts`
**Description:** Move a page to a different folder.

---

**Name:** `MoveRedirectUseCase`
**Import:** `import { MoveRedirectUseCase } from "webiny/api/website-builder/redirect"`
**Source:** `@webiny/api-website-builder/features/redirects/MoveRedirect/abstractions.ts`
**Description:** Move a URL redirect to a different folder.

---

**Name:** `NextjsConfig`
**Import:** `import { NextjsConfig } from "webiny/api/website-builder/nextjs"`
**Source:** `@webiny/api-website-builder/features/nextjs/abstractions.ts`
**Description:** Configuration for Next.js website rendering.

---

**Name:** `PageAfterCreateEventHandler`
**Import:** `import { PageAfterCreateEventHandler } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/CreatePage/abstractions.ts`
**Description:** Hook into page lifecycle after a page is created.

---

**Name:** `PageAfterCreateRevisionFromEventHandler`
**Import:** `import { PageAfterCreateRevisionFromEventHandler } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/abstractions.ts`
**Description:** Hook into page lifecycle after a revision is created from existing.

---

**Name:** `PageAfterDeleteEventHandler`
**Import:** `import { PageAfterDeleteEventHandler } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/DeletePage/abstractions.ts`
**Description:** Hook into page lifecycle after a page is deleted.

---

**Name:** `PageAfterDuplicateEventHandler`
**Import:** `import { PageAfterDuplicateEventHandler } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/DuplicatePage/abstractions.ts`
**Description:** Hook into page lifecycle after a page is duplicated.

---

**Name:** `PageAfterMoveEventHandler`
**Import:** `import { PageAfterMoveEventHandler } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/MovePage/abstractions.ts`
**Description:** Hook into page lifecycle after a page is moved.

---

**Name:** `PageAfterPublishEventHandler`
**Import:** `import { PageAfterPublishEventHandler } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/PublishPage/abstractions.ts`
**Description:** Hook into page lifecycle after a page is published.

---

**Name:** `PageAfterRestoreEventHandler`
**Import:** `import { PageAfterRestoreEventHandler } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/RestorePage/abstractions.ts`

---

**Name:** `PageAfterTrashEventHandler`
**Import:** `import { PageAfterTrashEventHandler } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/TrashPage/abstractions.ts`

---

**Name:** `PageAfterUnpublishEventHandler`
**Import:** `import { PageAfterUnpublishEventHandler } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/UnpublishPage/abstractions.ts`
**Description:** Hook into page lifecycle after a page is unpublished.

---

**Name:** `PageAfterUpdateEventHandler`
**Import:** `import { PageAfterUpdateEventHandler } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/UpdatePage/abstractions.ts`
**Description:** Hook into page lifecycle after a page is updated.

---

**Name:** `PageBeforeCreateEventHandler`
**Import:** `import { PageBeforeCreateEventHandler } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/CreatePage/abstractions.ts`
**Description:** Hook into page lifecycle before a page is created.

---

**Name:** `PageBeforeCreateRevisionFromEventHandler`
**Import:** `import { PageBeforeCreateRevisionFromEventHandler } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/abstractions.ts`
**Description:** Hook into page lifecycle before a revision is created from existing.

---

**Name:** `PageBeforeDeleteEventHandler`
**Import:** `import { PageBeforeDeleteEventHandler } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/DeletePage/abstractions.ts`
**Description:** Hook into page lifecycle before a page is deleted.

---

**Name:** `PageBeforeDuplicateEventHandler`
**Import:** `import { PageBeforeDuplicateEventHandler } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/DuplicatePage/abstractions.ts`
**Description:** Hook into page lifecycle before a page is duplicated.

---

**Name:** `PageBeforeMoveEventHandler`
**Import:** `import { PageBeforeMoveEventHandler } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/MovePage/abstractions.ts`
**Description:** Hook into page lifecycle before a page is moved.

---

**Name:** `PageBeforePublishEventHandler`
**Import:** `import { PageBeforePublishEventHandler } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/PublishPage/abstractions.ts`
**Description:** Hook into page lifecycle before a page is published.

---

**Name:** `PageBeforeRestoreEventHandler`
**Import:** `import { PageBeforeRestoreEventHandler } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/RestorePage/abstractions.ts`

---

**Name:** `PageBeforeTrashEventHandler`
**Import:** `import { PageBeforeTrashEventHandler } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/TrashPage/abstractions.ts`

---

**Name:** `PageBeforeUnpublishEventHandler`
**Import:** `import { PageBeforeUnpublishEventHandler } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/UnpublishPage/abstractions.ts`
**Description:** Hook into page lifecycle before a page is unpublished.

---

**Name:** `PageBeforeUpdateEventHandler`
**Import:** `import { PageBeforeUpdateEventHandler } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/UpdatePage/abstractions.ts`
**Description:** Hook into page lifecycle before a page is updated.

---

**Name:** `PublishPageUseCase`
**Import:** `import { PublishPageUseCase } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/PublishPage/abstractions.ts`
**Description:** Publish a page.

---

**Name:** `RedirectAfterCreateEventHandler`
**Import:** `import { RedirectAfterCreateEventHandler } from "webiny/api/website-builder/redirect"`
**Source:** `@webiny/api-website-builder/features/redirects/CreateRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle after a redirect is created.

---

**Name:** `RedirectAfterDeleteEventHandler`
**Import:** `import { RedirectAfterDeleteEventHandler } from "webiny/api/website-builder/redirect"`
**Source:** `@webiny/api-website-builder/features/redirects/DeleteRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle after a redirect is deleted.

---

**Name:** `RedirectAfterMoveEventHandler`
**Import:** `import { RedirectAfterMoveEventHandler } from "webiny/api/website-builder/redirect"`
**Source:** `@webiny/api-website-builder/features/redirects/MoveRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle after a redirect is moved.

---

**Name:** `RedirectAfterUpdateEventHandler`
**Import:** `import { RedirectAfterUpdateEventHandler } from "webiny/api/website-builder/redirect"`
**Source:** `@webiny/api-website-builder/features/redirects/UpdateRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle after a redirect is updated.

---

**Name:** `RedirectBeforeCreateEventHandler`
**Import:** `import { RedirectBeforeCreateEventHandler } from "webiny/api/website-builder/redirect"`
**Source:** `@webiny/api-website-builder/features/redirects/CreateRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle before a redirect is created.

---

**Name:** `RedirectBeforeDeleteEventHandler`
**Import:** `import { RedirectBeforeDeleteEventHandler } from "webiny/api/website-builder/redirect"`
**Source:** `@webiny/api-website-builder/features/redirects/DeleteRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle before a redirect is deleted.

---

**Name:** `RedirectBeforeMoveEventHandler`
**Import:** `import { RedirectBeforeMoveEventHandler } from "webiny/api/website-builder/redirect"`
**Source:** `@webiny/api-website-builder/features/redirects/MoveRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle before a redirect is moved.

---

**Name:** `RedirectBeforeUpdateEventHandler`
**Import:** `import { RedirectBeforeUpdateEventHandler } from "webiny/api/website-builder/redirect"`
**Source:** `@webiny/api-website-builder/features/redirects/UpdateRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle before a redirect is updated.

---

**Name:** `RestorePageUseCase`
**Import:** `import { RestorePageUseCase } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/RestorePage/abstractions.ts`

---

**Name:** `SchedulePublishPageUseCase`
**Import:** `import { SchedulePublishPageUseCase } from "webiny/api/website-builder/scheduler"`
**Source:** `@webiny/api-website-builder-scheduler/features/SchedulePublishPageUseCase/abstractions.ts`
**Description:** Schedule a page for future publishing.

---

**Name:** `SchedulePublishRedirectUseCase`
**Import:** `import { SchedulePublishRedirectUseCase } from "webiny/api/website-builder/scheduler"`
**Source:** `@webiny/api-website-builder-scheduler/features/SchedulePublishRedirectUseCase/abstractions.ts`
**Description:** Schedule a redirect for future publishing.

---

**Name:** `ScheduleUnpublishPageUseCase`
**Import:** `import { ScheduleUnpublishPageUseCase } from "webiny/api/website-builder/scheduler"`
**Source:** `@webiny/api-website-builder-scheduler/features/ScheduleUnpublishPageUseCase/abstractions.ts`
**Description:** Schedule a page for future unpublishing.

---

**Name:** `ScheduleUnpublishRedirectUseCase`
**Import:** `import { ScheduleUnpublishRedirectUseCase } from "webiny/api/website-builder/scheduler"`
**Source:** `@webiny/api-website-builder-scheduler/features/ScheduleUnpublishRedirectUseCase/abstractions.ts`
**Description:** Schedule a redirect for future unpublishing.

---

**Name:** `TrashPageUseCase`
**Import:** `import { TrashPageUseCase } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/TrashPage/abstractions.ts`

---

**Name:** `UnpublishPageUseCase`
**Import:** `import { UnpublishPageUseCase } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/UnpublishPage/abstractions.ts`
**Description:** Unpublish a page.

---

**Name:** `UpdatePageUseCase`
**Import:** `import { UpdatePageUseCase } from "webiny/api/website-builder/page"`
**Source:** `@webiny/api-website-builder/features/pages/UpdatePage/abstractions.ts`
**Description:** Update a page.

---

**Name:** `UpdateRedirectUseCase`
**Import:** `import { UpdateRedirectUseCase } from "webiny/api/website-builder/redirect"`
**Source:** `@webiny/api-website-builder/features/redirects/UpdateRedirect/abstractions.ts`
**Description:** Update a URL redirect.

---
