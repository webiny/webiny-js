# Webiny Skills

This directory contains skill documents that help LLMs and IDE agents understand how to build and extend Webiny projects. Each skill is a focused, self-contained reference covering one area of the platform.

## How to Use

1. Read the table below to find the skill(s) relevant to your task.
2. Load the corresponding `.md` file for detailed patterns, imports, and working code examples.
3. Check the "Related Skills" section at the bottom of each document for additional context when a task spans multiple concerns.

## Skill Registry

| Skill File | Description | Use When… |
|---|---|---|
| [`webiny-project-structure.md`](./webiny-project-structure.md) | Project layout, `webiny.config.tsx` anatomy, extension registration | User asks about folder structure, how to register extensions, where code goes, or project configuration |
| [`creating-content-models-via-code.md`](./creating-content-models-via-code.md) | `ModelFactory` pattern — fields, validators, renderers, layout | User wants to create, modify, or understand a content model definition |
| [`custom-graphql-api.md`](./custom-graphql-api.md) | `GraphQLSchemaFactory` — custom queries, mutations, resolvers | User wants to add custom GraphQL endpoints or business logic to the API |
| [`lifecycle-events.md`](./lifecycle-events.md) | CMS entry lifecycle hooks and security event handlers | User wants to intercept creates/updates/deletes, validate data, or trigger side effects |
| [`admin-ui-extensions.md`](./admin-ui-extensions.md) | White-labeling, custom list columns, page-type forms, Lexical plugins | User wants to customize the Admin UI — branding, themes, table columns, forms |
| [`infrastructure-extensions.md`](./infrastructure-extensions.md) | Pulumi handlers, `<Infra.*>` components, environment config | User wants to modify AWS infrastructure, add tags, configure VPC/OpenSearch, or manage environments |
| [`cli-extensions.md`](./cli-extensions.md) | `CliCommandFactory` — custom CLI commands | User wants to add a custom command to the Webiny CLI |
| [`webiny-sdk.md`](./webiny-sdk.md) | `@webiny/sdk` — reading/writing CMS data from external apps | User is building a Next.js/Vue/Node app that fetches or writes content to Webiny |
| [`website-builder.md`](./website-builder.md) | `@webiny/website-builder-nextjs` — editor components, theming, CMS integration | User is building Website Builder components, customizing the theme, or integrating CMS data into WB pages |
| [`dependency-injection-patterns.md`](./dependency-injection-patterns.md) | The universal `createImplementation` pattern and injectable features | User is writing any extension and needs to understand DI, constructor injection, or available services |
| [`local-development-and-deployment.md`](./local-development-and-deployment.md) | Deploy, watch, environments, state files, Local Lambda dev | User asks about deploying, developing locally, managing environments, or debugging deployment issues |

