---
name: webiny-api-website-builder-catalog
context: webiny-api
description: >
  API — Website Builder — 52 abstractions.
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
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/abstractions.ts`
**Description:** Create a page revision from an existing one.

---

**Name:** `CreatePageUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/CreatePage/abstractions.ts`
**Description:** Create a new page.

---

**Name:** `CreateRedirectUseCase`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/CreateRedirect/abstractions.ts`
**Description:** Create a URL redirect.

---

**Name:** `DeletePageUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/DeletePage/abstractions.ts`
**Description:** Delete a page.

---

**Name:** `DeleteRedirectUseCase`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/DeleteRedirect/abstractions.ts`
**Description:** Delete a URL redirect.

---

**Name:** `DuplicatePageUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/DuplicatePage/abstractions.ts`
**Description:** Duplicate a page.

---

**Name:** `GetActiveRedirectsUseCase`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/GetActiveRedirects/abstractions.ts`
**Description:** Retrieve all active URL redirects.

---

**Name:** `GetPageByIdUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/GetPageById/abstractions.ts`
**Description:** Retrieve a page by ID.

---

**Name:** `GetPageByPathUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/GetPageByPath/abstractions.ts`
**Description:** Retrieve a page by its URL path.

---

**Name:** `GetPageRevisionsUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/GetPageRevisions/abstractions.ts`
**Description:** Retrieve all revisions of a page.

---

**Name:** `GetRedirectByIdUseCase`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/GetRedirectById/abstractions.ts`
**Description:** Retrieve a URL redirect by ID.

---

**Name:** `InvalidateRedirectsCacheUseCase`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/InvalidateRedirectsCache/abstractions.ts`
**Description:** Invalidate the redirects cache.

---

**Name:** `ListPagesUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/ListPages/abstractions.ts`
**Description:** List pages with filtering and pagination.

---

**Name:** `ListRedirectsUseCase`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/ListRedirects/abstractions.ts`
**Description:** List URL redirects with filtering.

---

**Name:** `MovePageUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/MovePage/abstractions.ts`
**Description:** Move a page to a different folder.

---

**Name:** `MoveRedirectUseCase`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/MoveRedirect/abstractions.ts`
**Description:** Move a URL redirect to a different folder.

---

**Name:** `NextjsConfig`
**Import:** `webiny/api/website-builder/nextjs`
**Source:** `@webiny/api-website-builder/features/nextjs/abstractions.ts`
**Description:** Configuration for Next.js website rendering.

---

**Name:** `PageAfterCreateEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/CreatePage/abstractions.ts`
**Description:** Hook into page lifecycle after a page is created.

---

**Name:** `PageAfterCreateRevisionFromEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/abstractions.ts`
**Description:** Hook into page lifecycle after a revision is created from existing.

---

**Name:** `PageAfterDeleteEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/DeletePage/abstractions.ts`
**Description:** Hook into page lifecycle after a page is deleted.

---

**Name:** `PageAfterDuplicateEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/DuplicatePage/abstractions.ts`
**Description:** Hook into page lifecycle after a page is duplicated.

---

**Name:** `PageAfterMoveEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/MovePage/abstractions.ts`
**Description:** Hook into page lifecycle after a page is moved.

---

**Name:** `PageAfterPublishEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/PublishPage/abstractions.ts`
**Description:** Hook into page lifecycle after a page is published.

---

**Name:** `PageAfterTrashEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/TrashPage/abstractions.ts`

---

**Name:** `PageAfterUnpublishEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/UnpublishPage/abstractions.ts`
**Description:** Hook into page lifecycle after a page is unpublished.

---

**Name:** `PageAfterUpdateEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/UpdatePage/abstractions.ts`
**Description:** Hook into page lifecycle after a page is updated.

---

**Name:** `PageBeforeCreateEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/CreatePage/abstractions.ts`
**Description:** Hook into page lifecycle before a page is created.

---

**Name:** `PageBeforeCreateRevisionFromEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/abstractions.ts`
**Description:** Hook into page lifecycle before a revision is created from existing.

---

**Name:** `PageBeforeDeleteEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/DeletePage/abstractions.ts`
**Description:** Hook into page lifecycle before a page is deleted.

---

**Name:** `PageBeforeDuplicateEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/DuplicatePage/abstractions.ts`
**Description:** Hook into page lifecycle before a page is duplicated.

---

**Name:** `PageBeforeMoveEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/MovePage/abstractions.ts`
**Description:** Hook into page lifecycle before a page is moved.

---

**Name:** `PageBeforePublishEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/PublishPage/abstractions.ts`
**Description:** Hook into page lifecycle before a page is published.

---

**Name:** `PageBeforeTrashEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/TrashPage/abstractions.ts`

---

**Name:** `PageBeforeUnpublishEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/UnpublishPage/abstractions.ts`
**Description:** Hook into page lifecycle before a page is unpublished.

---

**Name:** `PageBeforeUpdateEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/UpdatePage/abstractions.ts`
**Description:** Hook into page lifecycle before a page is updated.

---

**Name:** `PublishPageUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/PublishPage/abstractions.ts`
**Description:** Publish a page.

---

**Name:** `RedirectAfterCreateEventHandler`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/CreateRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle after a redirect is created.

---

**Name:** `RedirectAfterDeleteEventHandler`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/DeleteRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle after a redirect is deleted.

---

**Name:** `RedirectAfterMoveEventHandler`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/MoveRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle after a redirect is moved.

---

**Name:** `RedirectAfterUpdateEventHandler`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/UpdateRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle after a redirect is updated.

---

**Name:** `RedirectBeforeCreateEventHandler`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/CreateRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle before a redirect is created.

---

**Name:** `RedirectBeforeDeleteEventHandler`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/DeleteRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle before a redirect is deleted.

---

**Name:** `RedirectBeforeMoveEventHandler`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/MoveRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle before a redirect is moved.

---

**Name:** `RedirectBeforeUpdateEventHandler`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/UpdateRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle before a redirect is updated.

---

**Name:** `SchedulePublishPageUseCase`
**Import:** `webiny/api/website-builder/scheduler`
**Source:** `@webiny/api-website-builder-scheduler/features/SchedulePublishPageUseCase/abstractions.ts`
**Description:** Schedule a page for future publishing.

---

**Name:** `SchedulePublishRedirectUseCase`
**Import:** `webiny/api/website-builder/scheduler`
**Source:** `@webiny/api-website-builder-scheduler/features/SchedulePublishRedirectUseCase/abstractions.ts`
**Description:** Schedule a redirect for future publishing.

---

**Name:** `ScheduleUnpublishPageUseCase`
**Import:** `webiny/api/website-builder/scheduler`
**Source:** `@webiny/api-website-builder-scheduler/features/ScheduleUnpublishPageUseCase/abstractions.ts`
**Description:** Schedule a page for future unpublishing.

---

**Name:** `ScheduleUnpublishRedirectUseCase`
**Import:** `webiny/api/website-builder/scheduler`
**Source:** `@webiny/api-website-builder-scheduler/features/ScheduleUnpublishRedirectUseCase/abstractions.ts`
**Description:** Schedule a redirect for future unpublishing.

---

**Name:** `TrashPageUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/TrashPage/abstractions.ts`

---

**Name:** `UnpublishPageUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/UnpublishPage/abstractions.ts`
**Description:** Unpublish a page.

---

**Name:** `UpdatePageUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/UpdatePage/abstractions.ts`
**Description:** Update a page.

---

**Name:** `UpdateRedirectUseCase`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/UpdateRedirect/abstractions.ts`
**Description:** Update a URL redirect.

---
