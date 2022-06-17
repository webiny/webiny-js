# Initialization and Running The Apps

The following examples show how each of the included Pulumi apps are initialized and run.

> 💡 **TIP**
>
> Pulumi apps included in this package are automatically included in every Webiny project that's configured to be deployed into Amazon Web Services (AWS).

## Storage App

```ts
// This is imported in our Pulumi program's entrypoint file (index.ts).
import { createStoragePulumiApp } from "@webiny/pulumi-app-aws";

export = async () => {
  const storageApp = createStorageApp();

  return myApp.runProgram();
};
```

## API App

```ts
// This is imported in our Pulumi program's entrypoint file (index.ts).
import { createApiPulumiApp } from "@webiny/pulumi-app-aws";

export = async () => {
  const apiApp = createApiApp();

  return myApp.runProgram();
};
```

## Admin App

```ts
// This is imported in our Pulumi program's entrypoint file (index.ts).
import { createAdminPulumiApp } from "@webiny/pulumi-app-aws";

export = async () => {
  const adminApp = createAdminApp();

  return myApp.runProgram();
};
```

## Website App

```ts
// This is imported in our Pulumi program's entrypoint file (index.ts).
import { createWebsitePulumiApp } from "@webiny/pulumi-app-aws";

export = async () => {
  const websiteApp = createWebsiteApp();

  return myApp.runProgram();
};
```
