# Funnel Builder Extension

The Funnel Builder extension adds multi-step funnel capabilities to Webiny's Website Builder.

> **Architecture Change from v5**: Unlike Webiny v5 where everything was on the Webiny side, v6 separates concerns: **public website rendering happens in Next.js**, while **Webiny Admin is purely an editor UI** for building funnels, managing steps, defining condition rules, and dropping fields. All visual components and React code live in your Next.js app. See [How It All Fits Together](https://www.webiny.com/learn/course/website-builder/setting-up-website-builder) for details.

> **Note**: This README covers the Webiny backend extension setup. For Next.js frontend implementation details (multi-tenancy, theming, component customization), see the [Next.js Starter Kit README](https://github.com/webiny/website-builder-nextjs/blob/funnel-builder/README.md).

## Setup Guide

### Step 1: Install the Extension

This extension is already installed in your Webiny project. If you need to verify, check that `extensions/funnelBuilder/` exists in your project root.

### Step 2: Clone the Next.js Starter Kit

The Funnel Builder requires a Next.js frontend app to render your funnels. Clone the official starter kit with funnel support:

```bash
git clone -b funnel-builder https://github.com/webiny/website-builder-nextjs.git my-funnel-app
cd my-funnel-app
npm install
```

**Important**: Make sure to clone the `funnel-builder` branch, which includes all the necessary funnel components.

**Note**: Once cloned, you can move this code to your own private repository for version control and customization. The starter kit is meant to be a starting point for your own project.

Before running `npm install`, verify that the `@webiny/website-builder-nextjs` and `@webiny/sdk` versions in `package.json` match your Webiny version. You can check your version with:

```bash
webiny --version
```

If your Webiny version is `6.2.1`, your `package.json` should have:

```json
{
  "dependencies": {
    "@webiny/website-builder-nextjs": "~6.2.1",
    "@webiny/sdk": "~6.2.1"
  }
}
```

### Step 3: Start Your Webiny Admin App

You'll need the Admin app running to configure the Next.js connection:

- **Locally**: Run `yarn webiny watch admin` in your Webiny project directory
- **Deployed**: Use your Admin CloudFront URL directly

### Step 4: Get Your API Credentials

In Webiny Admin:

1. Click **Support** in the bottom-left sidebar
2. Select **Configure Next.js**
3. Copy the environment variables shown in the dialog

The dialog will show:

```bash
NEXT_PUBLIC_WEBSITE_BUILDER_API_KEY=your-api-key-here
NEXT_PUBLIC_WEBSITE_BUILDER_API_HOST=https://your-api-host.com
NEXT_PUBLIC_WEBSITE_BUILDER_API_TENANT=root
```

**Note**: The `NEXT_PUBLIC_WEBSITE_BUILDER_API_TENANT` variable is only needed when working with a single tenant. The Next.js starter kit resolves tenant at runtime from the hostname subdomain (for public traffic) or the `wb.tenant` query param (from the editor iframe). See the Next.js repo README for details on multi-tenant setup.

If your Admin is running on a non-localhost domain (deployed CloudFront URL), the dialog will also include `NEXT_PUBLIC_WEBSITE_BUILDER_ADMIN_HOST` — make sure to copy that too.

### Step 5: Configure Your Next.js App

Create a `.env` file in your Next.js project root:

```bash
NEXT_PUBLIC_WEBSITE_BUILDER_API_KEY=your-api-key-here
NEXT_PUBLIC_WEBSITE_BUILDER_API_HOST=https://your-api-host.com
# NEXT_PUBLIC_WEBSITE_BUILDER_API_TENANT=root  # Only needed for single-tenant setups
```

### Step 6: Start the Next.js Dev Server

```bash
npm run dev
```

Your Next.js app will be available at [http://localhost:3000](http://localhost:3000).

## Creating Your First Funnel

1. In Webiny Admin, go to **Website Builder → Pages**
2. Click **New Page**
3. Set the **Page Type** to **Funnel**
4. Set a **Title** (e.g., "Lead Generation Funnel") and **Path** (e.g., `/get-started`)
5. Click **Create**
6. Build your funnel using the available components in the editor
7. Click **Publish**
8. Visit your Next.js app at the configured path (e.g., `http://localhost:3000/get-started`)

The funnel editor and components work the same as in Webiny v5. If you're migrating from v5, you'll find all the familiar mechanics and features.

## Tenant Theming

The Funnel Builder extension extends the Webiny Tenant model with theme settings that can be accessed by your Next.js app for dynamic styling.

### Theme Fields Added to Tenant Settings

The extension adds a "Theme" section to **Tenant Settings** with the following fields:

- **Primary Color**: Primary brand color (e.g., `#ff0000`)
- **Secondary Color**: Secondary brand color (e.g., `#0000ff`)
- **Logo URL**: URL of the tenant logo

These values are stored under `tenant.extensions.theme` and can be fetched via the Webiny SDK.

### Accessing Theme Values in Next.js

Your Next.js app can fetch these tenant-specific theme values using the SDK:

```typescript
import { createSdk } from "@/src/lib/webiny";

const result = await createSdk(tenantId).tenantManager.getCurrentTenant();
const theme = result.value.values.extensions?.theme ?? {};

// theme.primaryColor
// theme.secondaryColor
// theme.logo
```

The Next.js starter kit includes `getTenantThemeCss()` which automatically fetches these values and generates CSS custom properties that can be used throughout your app. See the Next.js repo README for implementation details.

### Configuring Theme Values

**For Non-Root Tenants:**

1. In Webiny Admin, go to **Settings → Tenant Settings**
2. Find the **Theme** section
3. Set your Primary Color, Secondary Color, and Logo URL
4. Save the settings
5. Your Next.js app will automatically fetch and apply these values on the next request

**For Root Tenant:**

The Theme settings UI is not available for the root tenant. If you need to configure theme values for the root tenant, you must edit them via the API using the Tenant Manager SDK.

```typescript
// Example: Update root tenant theme via API
const sdk = createSdk("root");
await sdk.tenantManager.updateTenant({
  id: "root",
  values: {
    extensions: {
      theme: {
        primaryColor: "#ff0000",
        secondaryColor: "#0000ff",
        logo: "https://example.com/logo.png"
      }
    }
  }
});
```

## Learn More

- **Website Builder Docs**: [webiny.com/learn/course/website-builder](https://www.webiny.com/learn/course/website-builder/setting-up-website-builder)
- **Next.js Starter Kit**: [github.com/webiny/website-builder-nextjs](https://github.com/webiny/website-builder-nextjs) (funnel-builder branch)
- **Webiny Community**: [webiny.com/slack](https://www.webiny.com/slack)
