# Page Builder - Legacy Page Rendering Engine Development

## Introduction

With [5.34.0](https://www.webiny.com/docs/release-notes/5.34.0/changelog#page-elements-a-brand-new-page-rendering-engine-2898), we've released a new page rendering engine for our Webiny's Page Builder app.

At the moment, our development repository is set up to use the new page rendering engine and this is fine for the most part. But, from time to time, there will be code changes that will require us to test the legacy page rendering engine as well. Most often, we'll want to test that we didn't break something and that the legacy page rendering engine still works as expected.  

This document outlines the steps necessary to enable the legacy page rendering engine, so that testing can be performed.

## Steps

The first step is to open your `webiny.project.ts` file, and set the `pbLegacyRenderingEngine` feature flag to true. 

```ts
// webiny.project.ts
{
    // (...)
    
    featureFlags: {
        // Enforces usage of legacy PB page elements rendering engine.
        // To migrate to the latest one, please read:
        // https://www.webiny.com/docs/page-builder-rendering-upgrade
        pbLegacyRenderingEngine: true
    }
}
```

Once that's enabled, the next step is bringing back the legacy application code within the `apps` folder.

This can be done by simply replacing the `apps/admin`, `apps/theme` and `apps/website` folders with the 5.33.5 version ones, found here: https://github.com/webiny/webiny-js/tree/v5.33.5/apps

Once replacements are in place, you should be able to start the Admin/Website apps, with Page Builder pages being rendered with the legacy page rendering engine.

Note that once the switch has been made, it's not expected for the pages created with the new page rendering engine to looks visually correct. Visual errors are to be expected, so, for testing, new pages should be created.