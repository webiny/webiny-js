---
name: webiny-project-structure
context: webiny-extensions
description: >
  Webiny project layout, webiny.config.tsx anatomy, and extension registration.
  Use this skill when the developer asks about folder structure, where custom code goes,
  how to register extensions, what webiny.config.tsx does, or how the project is organized.
  Also use when they need to understand the relationship between extensions/, webiny.config.tsx,
  and the different extension types (Api, Admin, Infra, CLI).
---

# Webiny Project Structure

## TL;DR

A Webiny project has a flat structure centered around `webiny.config.tsx` -- the single configuration file where all extensions are registered. Custom code lives in the `extensions/` folder. Extensions are registered as React components (`<Api.Extension>`, `<Admin.Extension>`, `<Infra.*>`, `<Cli.Command>`) and can be conditionally loaded per environment.

## Project Layout

```
my-webiny-project/
├── extensions/          # All custom code -- API, Admin, Infra, CLI extensions
│   └── README.md
├── public/              # Static assets for the Admin app
│   ├── favicon.ico
│   ├── global.css
│   ├── index.html
│   └── robots.txt
├── eslint.config.js     # ESLint configuration
├── package.json         # Single package.json for the whole project
├── tsconfig.json        # Single TypeScript config
├── webiny.config.tsx    # Main configuration -- all extensions registered here
├── webiny-env.d.ts      # TypeScript environment types
└── yarn.lock
```

Key points:

- **Single `package.json`** -- no monorepo, no workspaces needed.
- **Single `tsconfig.json`** -- straightforward TypeScript setup.
- **`webiny.config.tsx`** -- the entry point for everything. All extensions, infrastructure options, and project settings are declared here.
- **`extensions/`** -- where all your custom code lives. Organize with subfolders as needed (e.g., `extensions/contactSubmission/`, `extensions/AdminBranding/`).

## The `webiny.config.tsx` File

This file exports a single React component called `Extensions`. It uses JSX to declaratively register all configuration:

```tsx
// webiny.config.tsx
import React from "react";
import { Admin, Api, Cli, Infra, Project, Security } from "webiny/extensions";
import { Cognito } from "@webiny/cognito";

export const Extensions = () => {
  return (
    <>
      {/* Infrastructure configuration */}
      <Infra.Aws.DefaultRegion name={"us-east-1"} />
      <Infra.OpenSearch enabled={true} />
      <Infra.Aws.Tags tags={{ OWNER: "me", PROJECT: "my-project" }} />

      {/* Identity provider */}
      <Cognito />

      {/* API extensions (backend) */}
      <Api.Extension src={"/extensions/ProductCategoryModel.ts"} />
      <Api.Extension src={"/extensions/ProductModel.ts"} />
      <Api.Extension src={"/extensions/contactSubmission/ContactSubmissionHook.ts"} />

      {/* Security hooks */}
      <Api.Extension src={"/extensions/MyApiKey.ts"} />
      <Security.ApiKey.AfterUpdate src={"/extensions/MyApiKeyAfterUpdate.ts"} />

      {/* Admin extensions (frontend) */}
      <Admin.Extension src={"/extensions/AdminTheme/AdminTheme.tsx"} />
      <Admin.Extension src={"/extensions/AdminTitleLogo/AdminTitleLogo.tsx"} />
      <Admin.Extension src={"/extensions/contactSubmission/EmailEntryListColumn.tsx"} />

      {/* Infrastructure / Pulumi extensions */}
      <Infra.Core.Pulumi src={"/extensions/MyCorePulumiHandler.ts"} />

      {/* CLI extensions */}
      <Cli.Command src={"/extensions/MyCustomCommand.ts"} />

      {/* Project settings */}
      <Project.Telemetry enabled={false} />
    </>
  );
};
```

## Extension Types

| JSX Element                                 | What It Does                                                                             | File Type |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- | --------- |
| `<Api.Extension src="..." />`               | Registers a backend extension (GraphQL schemas, content models, lifecycle hooks)         | `.ts`     |
| `<Admin.Extension src="..." />`             | Registers a frontend Admin UI extension (themes, branding, custom columns, custom forms) | `.tsx`    |
| `<Infra.Core.Pulumi src="..." />`           | Registers a Pulumi infrastructure handler                                                | `.ts`     |
| `<Cli.Command src="..." />`                 | Registers a custom CLI command                                                           | `.ts`     |
| `<Security.ApiKey.AfterUpdate src="..." />` | Registers a security lifecycle hook                                                      | `.ts`     |

**YOU MUST include the full file path with the `.ts` or `.tsx` extension in every `src` prop.** For example, use `src={"/extensions/MyModel.ts"}`, NOT `src={"/extensions/MyModel"}`. Omitting the file extension will cause a build failure.

**YOU MUST use `export default` for the `createImplementation()` call** when the file is targeted directly by an Extension `src` prop. Using a named export (`export const Foo = SomeFactory.createImplementation(...)`) will cause a build failure. Named exports are only valid inside files registered via `createFeature`.

## Infrastructure Components

Declarative components for configuring AWS infrastructure:

| Component                                                             | Purpose                                |
| --------------------------------------------------------------------- | -------------------------------------- |
| `<Infra.Aws.DefaultRegion name="us-east-1" />`                        | Set the AWS region                     |
| `<Infra.Aws.Tags tags={{ KEY: "value" }} />`                          | Apply tags to all AWS resources        |
| `<Infra.OpenSearch enabled={true} />`                                 | Enable/disable OpenSearch              |
| `<Infra.Vpc enabled={true} />`                                        | Enable/disable VPC deployment          |
| `<Infra.PulumiResourceNamePrefix prefix="myproj-" />`                 | Prefix all Pulumi resource names       |
| `<Infra.ProductionEnvironments environments={["prod", "staging"]} />` | Define which envs use production infra |
| `<Project.Telemetry enabled={false} />`                               | Enable/disable telemetry               |

## Environment-Conditional Configuration

Use `<Infra.Env.Is>` to load extensions or config only in specific environments:

```tsx
<Infra.Env.Is env="prod">
    <Infra.Aws.Tags tags={{ ENV: "production" }} />
    <Infra.OpenSearch enabled={true} />
</Infra.Env.Is>

<Infra.Env.Is env={["dev", "staging"]}>
    <Infra.Aws.Tags tags={{ ENV: "non-production" }} />
    <Infra.OpenSearch enabled={false} />
</Infra.Env.Is>
```

## Build Parameters

Build parameters pass values from config to extensions at build time. They are accessed in backend code via the `BuildParams` DI service (see dependency-injection skill).

**Rule: `<Api.BuildParam>` and `<Admin.BuildParam>` MUST live inside the extension's `Extension.tsx`, NOT directly in `webiny.config.tsx`.** Required parameters are exposed as React props on the extension component. The consumer in `webiny.config.tsx` decides where the value comes from (env var, hardcoded, config, etc.).

```tsx
// extensions/myExtension/Extension.tsx
import React from "react";
import { Api } from "webiny/extensions";

interface MyExtensionProps {
  apiKey: string;
}

export const MyExtension = ({ apiKey }: MyExtensionProps) => {
  return (
    <>
      <Api.BuildParam paramName="MY_API_KEY" value={apiKey} />
      <Api.Extension src={"@/extensions/myExtension/features/myService/feature.ts"} />
    </>
  );
};
```

```tsx
// webiny.config.tsx — consumer decides where the value comes from
<MyExtension apiKey={process.env.MY_API_KEY || ""} />
```

This keeps extensions self-contained — all required configuration is declared via typed props in one place.

## Installing Pre-Built Extensions

Webiny provides official extensions you can install with:

```bash
yarn webiny extension <extension-name>
```

This downloads the extension code into `extensions/`, updates `webiny.config.tsx` to register it, and gives you full access to modify the code.

## Related Skills

- `webiny-dependency-injection` -- How extensions use DI to access services
- `webiny-local-development` -- How to deploy and develop locally
- `webiny-full-stack-architect` -- Full-stack extension skeleton, entry points, and shared domain layer
