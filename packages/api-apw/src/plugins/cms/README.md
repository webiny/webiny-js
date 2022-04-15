# APW for CMS

## Overview

This file contains a high-level overview of the process of integrating CMS with Advanced Publishing Workflow (APW). We
will only discuss _API_ side of things here but if you are interested in _APP_ side please feel free to check
out [this file](/packages/app-apw/src/plugins/cms/README.md).

We have already integrated the Page Builder application. The [pageBuilder](../pageBuilder) folder contains all the
source code (plugins, methods) for integrating it with APW.

We will briefly discuss each of those files:

- [apwContentPagePlugins.ts](../pageBuilder/apwContentPagePlugins.ts) - It registers functions onto APW context which
  helps to execute logic such as `getContent`, `publishContent` and `unpublishContent` during the whole workflow.
- [linkContentReviewToPage.ts](../pageBuilder/linkContentReviewToPage.ts) - It contains logic for hooking into apw
  `contentReivew` and `page` lifecycle events to manipulate `apw.contentReviewId` property in page `settings`. Which is
  essential for performing various business logic checks across the APW application.
- [linkWorkflowToPage.ts](../pageBuilder/linkWorkflowToPage.ts) - It contains logic for hooking into apw
  `contentReivew` and `page` lifecycle events to manipulate `apw.workflowId` property in page `settings`. Which is
  essential for performing various business logic checks across the APW application.
- [triggerContentReview.ts](../pageBuilder/triggerContentReview.ts) - It contains logic for hooking
  into `onBeforePagePublish`
  lifecycle event to execute various business logic checks which among other things prevent triggering more than one
  __content review__ for a page.
- [updateContentReviewStatus.ts](../pageBuilder/updateContentReviewStatus.ts) - As the name suggest, this file contains
  logic that hooks into `onAfterPagePublish` and `onAfterPageUnPublish` lifecycle events to update __content review__
  status and metadata accordingly.
- [utils.ts](../pageBuilder/utils.ts) - It contains various helper functions that are used in the above-mentioned files.
  I would like to highlight [`assignWorkflowToPage`](../pageBuilder/utils.ts#L70) function
  which is responsible for assigning the most suitable workflow to a page. We need to implement a similar function that
  will work with CMS.

As you may have already noticed we are heavily using lifecycle events
from [`AdvancedPublishingWorkflow`](/packages/api-apw/src/types.ts#L467)
and [`PageBuilderContextObject`](/packages/api-page-builder/src/graphql/types.ts#L505)
to executing various business logic which makes it modular and easy to understand.

One can follow a similar approach when building the APW integration for CMS. A good amount of code can be taken
from [pageBuilder](../pageBuilder) and make it work for CMS with slight adjustment to how CMS works.

## We should keep in mind the following points about CMS when building the integration:

- CMS entry does not offer a place to store any metadata at the moment. For instance, we need to store `apw` object
  containing `contentReviewId` and `workflowId` for it to be integrated with APW.
- Unlike PB page, to load an entry we need to know `modelId` as well besides the `entryId`. So, make sure that we save
  that information when assigning __entries__ to a workflow.


