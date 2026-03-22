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

1. Find the abstraction you need below
2. Read the source file to get the exact interface and types
3. Import: `import { ClassName } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---
**Class:** `CreatePageRevisionFromUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/abstractions.ts`
**Description:** Create a page revision from an existing one.

---
**Class:** `CreatePageUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/CreatePage/abstractions.ts`
**Description:** Create a new page.

---
**Class:** `CreateRedirectUseCase`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/CreateRedirect/abstractions.ts`
**Description:** Create a URL redirect.

---
**Class:** `DeletePageUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/DeletePage/abstractions.ts`
**Description:** Delete a page.

---
**Class:** `DeleteRedirectUseCase`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/DeleteRedirect/abstractions.ts`
**Description:** Delete a URL redirect.

---
**Class:** `DuplicatePageUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/DuplicatePage/abstractions.ts`
**Description:** Duplicate a page.

---
**Class:** `GetActiveRedirectsUseCase`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/GetActiveRedirects/abstractions.ts`
**Description:** Retrieve all active URL redirects.

---
**Class:** `GetPageByIdUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/GetPageById/abstractions.ts`
**Description:** Retrieve a page by ID.

---
**Class:** `GetPageByPathUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/GetPageByPath/abstractions.ts`
**Description:** Retrieve a page by its URL path.

---
**Class:** `GetPageRevisionsUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/GetPageRevisions/abstractions.ts`
**Description:** Retrieve all revisions of a page.

---
**Class:** `GetRedirectByIdUseCase`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/GetRedirectById/abstractions.ts`
**Description:** Retrieve a URL redirect by ID.

---
**Class:** `InvalidateRedirectsCacheUseCase`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/InvalidateRedirectsCache/abstractions.ts`
**Description:** Invalidate the redirects cache.

---
**Class:** `ListPagesUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/ListPages/abstractions.ts`
**Description:** List pages with filtering and pagination.

---
**Class:** `ListRedirectsUseCase`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/ListRedirects/abstractions.ts`
**Description:** List URL redirects with filtering.

---
**Class:** `MovePageUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/MovePage/abstractions.ts`
**Description:** Move a page to a different folder.

---
**Class:** `MoveRedirectUseCase`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/MoveRedirect/abstractions.ts`
**Description:** Move a URL redirect to a different folder.

---
**Class:** `NextjsConfig`
**Import:** `webiny/api/website-builder/nextjs`
**Source:** `@webiny/api-website-builder/features/nextjs/abstractions.ts`
**Description:** Configuration for Next.js website rendering.

---
**Class:** `PageAfterCreateEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/CreatePage/abstractions.ts`
**Description:** Hook into page lifecycle after a page is created.

---
**Class:** `PageAfterCreateRevisionFromEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/abstractions.ts`
**Description:** Hook into page lifecycle after a revision is created from existing.

---
**Class:** `PageAfterDeleteEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/DeletePage/abstractions.ts`
**Description:** Hook into page lifecycle after a page is deleted.

---
**Class:** `PageAfterDuplicateEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/DuplicatePage/abstractions.ts`
**Description:** Hook into page lifecycle after a page is duplicated.

---
**Class:** `PageAfterMoveEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/MovePage/abstractions.ts`
**Description:** Hook into page lifecycle after a page is moved.

---
**Class:** `PageAfterPublishEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/PublishPage/abstractions.ts`
**Description:** Hook into page lifecycle after a page is published.

---
**Class:** `PageAfterUnpublishEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/UnpublishPage/abstractions.ts`
**Description:** Hook into page lifecycle after a page is unpublished.

---
**Class:** `PageAfterUpdateEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/UpdatePage/abstractions.ts`
**Description:** Hook into page lifecycle after a page is updated.

---
**Class:** `PageBeforeCreateEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/CreatePage/abstractions.ts`
**Description:** Hook into page lifecycle before a page is created.

---
**Class:** `PageBeforeCreateRevisionFromEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/abstractions.ts`
**Description:** Hook into page lifecycle before a revision is created from existing.

---
**Class:** `PageBeforeDeleteEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/DeletePage/abstractions.ts`
**Description:** Hook into page lifecycle before a page is deleted.

---
**Class:** `PageBeforeDuplicateEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/DuplicatePage/abstractions.ts`
**Description:** Hook into page lifecycle before a page is duplicated.

---
**Class:** `PageBeforeMoveEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/MovePage/abstractions.ts`
**Description:** Hook into page lifecycle before a page is moved.

---
**Class:** `PageBeforePublishEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/PublishPage/abstractions.ts`
**Description:** Hook into page lifecycle before a page is published.

---
**Class:** `PageBeforeUnpublishEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/UnpublishPage/abstractions.ts`
**Description:** Hook into page lifecycle before a page is unpublished.

---
**Class:** `PageBeforeUpdateEventHandler`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/UpdatePage/abstractions.ts`
**Description:** Hook into page lifecycle before a page is updated.

---
**Class:** `PublishPageUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/PublishPage/abstractions.ts`
**Description:** Publish a page.

---
**Class:** `RedirectAfterCreateEventHandler`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/CreateRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle after a redirect is created.

---
**Class:** `RedirectAfterDeleteEventHandler`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/DeleteRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle after a redirect is deleted.

---
**Class:** `RedirectAfterMoveEventHandler`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/MoveRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle after a redirect is moved.

---
**Class:** `RedirectAfterUpdateEventHandler`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/UpdateRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle after a redirect is updated.

---
**Class:** `RedirectBeforeCreateEventHandler`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/CreateRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle before a redirect is created.

---
**Class:** `RedirectBeforeDeleteEventHandler`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/DeleteRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle before a redirect is deleted.

---
**Class:** `RedirectBeforeMoveEventHandler`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/MoveRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle before a redirect is moved.

---
**Class:** `RedirectBeforeUpdateEventHandler`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/UpdateRedirect/abstractions.ts`
**Description:** Hook into redirect lifecycle before a redirect is updated.

---
**Class:** `SchedulePublishPageUseCase`
**Import:** `webiny/api/website-builder/scheduler`
**Source:** `@webiny/api-website-builder-scheduler/features/SchedulePublishPageUseCase/abstractions.ts`
**Description:** Schedule a page for future publishing.

---
**Class:** `SchedulePublishRedirectUseCase`
**Import:** `webiny/api/website-builder/scheduler`
**Source:** `@webiny/api-website-builder-scheduler/features/SchedulePublishRedirectUseCase/abstractions.ts`
**Description:** Schedule a redirect for future publishing.

---
**Class:** `ScheduleUnpublishPageUseCase`
**Import:** `webiny/api/website-builder/scheduler`
**Source:** `@webiny/api-website-builder-scheduler/features/ScheduleUnpublishPageUseCase/abstractions.ts`
**Description:** Schedule a page for future unpublishing.

---
**Class:** `ScheduleUnpublishRedirectUseCase`
**Import:** `webiny/api/website-builder/scheduler`
**Source:** `@webiny/api-website-builder-scheduler/features/ScheduleUnpublishRedirectUseCase/abstractions.ts`
**Description:** Schedule a redirect for future unpublishing.

---
**Class:** `UnpublishPageUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/UnpublishPage/abstractions.ts`
**Description:** Unpublish a page.

---
**Class:** `UpdatePageUseCase`
**Import:** `webiny/api/website-builder/page`
**Source:** `@webiny/api-website-builder/features/pages/UpdatePage/abstractions.ts`
**Description:** Update a page.

---
**Class:** `UpdateRedirectUseCase`
**Import:** `webiny/api/website-builder/redirect`
**Source:** `@webiny/api-website-builder/features/redirects/UpdateRedirect/abstractions.ts`
**Description:** Update a URL redirect.

---
