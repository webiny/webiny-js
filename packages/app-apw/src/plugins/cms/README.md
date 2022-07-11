# APW for CMS

## Overview

This file contains a high-level overview of the process of integrating CMS with Advanced Publishing Workflow (APW). We
will only discuss _APP_ side of things here but if you are interested in _API_ side please feel free to check
out [this file](/packages/api-apw/src/plugins/cms/README.md).

We have already integrated the Page Builder application. [pageBuilder](../pageBuilder) folder contains all the source
code (plugins and components) for integrating it with APW.

We will briefly discuss each of those files here:

- [ApwOnPublish.tsx](../pageBuilder/ApwOnPublish.tsx) - It contains a React component `ApwOnPublish` which does not
  render any UI. But, contains the logic of hooking into the `onPagePublish` event
  from [`AdminPageBuilderContext`](/packages/app-page-builder/src/admin/contexts/AdminPageBuilder.tsx#L23) to execute
  the necessary business logic which is to find out if a review is required for the page and prompt the user to request
  a review.

    - Also keep in mind that we have implemented the `AdminPageBuilderContext` specifically for these hooks, and we need
      to implement the same for cms.

    - Along with that, we have also replaced existing code that trigger `publishPage/publishRevision`
      mutation throughout [`@webiny/app-page-builder`](/packages/app-page-builder) with `publishPage` method from
      the `AdminPageBuilderContext`.

    - [`DefaultOnPagePublish`](/packages/app-page-builder/src/admin/plugins/pageDetails/pageRevisions/DefaultOnPagePublish.tsx)
      contains the complete code for it. We need to do similar changes for
      the [`@webiny/app-headless-cms`](/packages/app-headless-cms).


- [ApwOnDelete.tsx](../pageBuilder/ApwOnDelete.tsx) - Similar to the above, it contains a React
  component `ApwOnPageDelete` which does not render any UI. But, contains the logic of hooking into the `onPageDelete`
  event from [`AdminPageBuilderContext`](/packages/app-page-builder/src/admin/contexts/AdminPageBuilder.tsx#L23) to
  execute the necessary business logic.

    - Same as with __publish__ we have implemented `onPageDelete` hook and `deletePage` method
      in `AdminPageBuilderContext`
      which needs to be translated for `@webiny/app-headless-cms`.

    - Along with that, we have also replaced existing code that trigger `deletePage/deleteRevision`
      mutation throughout [`@webiny/app-page-builder`](/packages/app-page-builder) with `deletePage` method from
      the `AdminPageBuilderContext`.

    - [`DefaultOnPageDelete`](/packages/app-page-builder/src/admin/plugins/pageDetails/pageRevisions/DefaultOnPageDelete.tsx)
      contains the complete code for it. We need to do similar changes for
      the [`@webiny/app-headless-cms`](/packages/app-headless-cms).

- [PublishPageHocs.tsx](../pageBuilder/PublishPageHocs.tsx) - It contains a couple of React higher ordered components (
  HOCs) that are responsible for rendering a different UI in the `@webiny/app-page-builder` based on application state.
  For instance, consider [`PublishPageButtonHoc`](../pageBuilder/PublishPageHocs.tsx), which renders a different UI if a
  page is __under review__. This functionality is made possible
  by [`Compose`](/packages/app-admin-core/src/components/core/Compose.tsx)
  and [`makeComposable`](/packages/app-admin-core/src/makeComposable.tsx) helpers.

  > Please feel free to check out Webiny docs to learn more about [the compose component](https://www.webiny.com/docs/admin-area/basics/framework#the-compose-component).

One can follow a similar approach when building the APW integration for CMS. A good amount of code can be taken
from [pageBuilder](../pageBuilder) and make it work for CMS with slight adjustment to handle how CMS works.


## Make the package type agnostic

Currently, everything is hardcoded. So make it possible to add new functionality via plugins or Compose API.
