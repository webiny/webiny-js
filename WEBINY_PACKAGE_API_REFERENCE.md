# Webiny Package API Reference

This document provides a comprehensive reference of all exports from the `webiny` package - the primary package that Webiny users interact with.

## Table of Contents

- [Overview](#overview)
- [Project Configuration](#project-configuration)
- [Infrastructure Lifecycle Hooks](#infrastructure-lifecycle-hooks)
- [Infrastructure/Pulumi Extensions](#infrastructurepulumi-extensions)
- [CLI Extensions](#cli-extensions)
- [Admin UI Extensions](#admin-ui-extensions)
- [Security Extensions](#security-extensions)
- [API Features - System & Settings](#api-features---system--settings)
- [API Features - Tenancy](#api-features---tenancy)
- [API Features - Security](#api-features---security)
- [API Features - WCP (Webiny Control Panel)](#api-features---wcp-webiny-control-panel)
- [CLI Features](#cli-features)
- [Services](#services)

---

## Overview

The `webiny` package serves as the main entry point for Webiny users. It re-exports functionality from internal packages (`@webiny/project`, `@webiny/project-aws`, `@webiny/api-core`, `@webiny/cli-core`, `@webiny/app-admin`) in a user-friendly structure.

### Installation

```bash
npm install webiny
# or
yarn add webiny
```

### Basic Usage

```typescript
import { Infra, Project, Security } from "webiny/extensions";
```

---

## Project Configuration

### `Project.Id`

Configure the unique identifier for your Webiny project.

**Import Path:** `webiny/extensions`

**Usage:**
```tsx
import { Project } from "webiny/extensions";

<Project.Id value="my-project-id" />
```

**Props:**
- `value: string` - Your unique project identifier

---

### `Project.Telemetry`

Configure telemetry settings for your Webiny project.

**Import Path:** `webiny/extensions`

**Usage:**
```tsx
import { Project } from "webiny/extensions";

<Project.Telemetry enabled={true} />
```

**Props:**
- `enabled: boolean` - Enable or disable telemetry

---

## Infrastructure Lifecycle Hooks

These hooks allow you to execute custom logic at various points in the infrastructure build, deployment, and watch lifecycle.

### Global Hooks

#### `Infra.BeforeBuild`

Execute logic before any app build starts.

**Import Path:** `webiny/infra/features/BeforeBuild`

**Exports:**
- `BeforeBuild` - Abstraction for the hook
- `BeforeBuild.Interface` - TypeScript interface
- `BeforeBuild.Params` - Parameters interface
- `BeforeBuild.createImplementation()` - Method to create implementations

**Usage:**
```typescript
import { BeforeBuild } from "webiny/infra/features/BeforeBuild";

class MyBeforeBuildImpl implements BeforeBuild.Interface {
    async execute(params: BeforeBuild.Params) {
        console.log("Building app:", params.app);
        // Your custom logic
    }
}

export const MyBeforeBuild = BeforeBuild.createImplementation({
    implementation: MyBeforeBuildImpl,
    dependencies: []
});
```

---

#### `Infra.AfterBuild`

Execute logic after any app build completes.

**Import Path:** `webiny/infra/features/AfterBuild`

**Exports:**
- `AfterBuild` - Abstraction for the hook
- `AfterBuild.Interface` - TypeScript interface
- `AfterBuild.Params` - Parameters interface
- `AfterBuild.createImplementation()` - Method to create implementations

---

#### `Infra.BeforeDeploy`

Execute logic before any app deployment starts.

**Import Path:** `webiny/infra/features/BeforeDeploy`

**Exports:**
- `BeforeDeploy` - Abstraction for the hook
- `BeforeDeploy.Interface` - TypeScript interface
- `BeforeDeploy.Params` - Parameters interface
- `BeforeDeploy.createImplementation()` - Method to create implementations

---

#### `Infra.AfterDeploy`

Execute logic after any app deployment completes.

**Import Path:** `webiny/infra/features/AfterDeploy`

**Exports:**
- `AfterDeploy` - Abstraction for the hook
- `AfterDeploy.Interface` - TypeScript interface
- `AfterDeploy.Params` - Parameters interface
- `AfterDeploy.createImplementation()` - Method to create implementations

---

#### `Infra.BeforeWatch`

Execute logic before any app watch mode starts.

**Import Path:** `webiny/infra/features/BeforeWatch`

**Exports:**
- `BeforeWatch` - Abstraction for the hook
- `BeforeWatch.Interface` - TypeScript interface
- `BeforeWatch.Params` - Parameters interface
- `BeforeWatch.createImplementation()` - Method to create implementations

---

### Admin App Hooks

#### `Infra.Admin.BeforeBuild`

Execute logic before the Admin app build starts.

**Import Path:** `webiny/infra/features/AdminBeforeBuild`

**Exports:**
- `AdminBeforeBuild` - Abstraction for the hook
- `AdminBeforeBuild.Interface` - TypeScript interface
- `AdminBeforeBuild.Params` - Parameters interface
- `AdminBeforeBuild.createImplementation()` - Method to create implementations

---

#### `Infra.Admin.AfterBuild`

Execute logic after the Admin app build completes.

**Import Path:** `webiny/infra/features/AdminAfterBuild`

---

#### `Infra.Admin.BeforeDeploy`

Execute logic before the Admin app deployment starts.

**Import Path:** `webiny/infra/features/AdminBeforeDeploy`

---

#### `Infra.Admin.AfterDeploy`

Execute logic after the Admin app deployment completes.

**Import Path:** `webiny/infra/features/AdminAfterDeploy`

---

#### `Infra.Admin.BeforeWatch`

Execute logic before the Admin app watch mode starts.

**Import Path:** `webiny/infra/features/AdminBeforeWatch`

---

### API App Hooks

#### `Infra.Api.BeforeBuild`

Execute logic before the API app build starts.

**Import Path:** `webiny/infra/features/ApiBeforeBuild`

**Exports:**
- `ApiBeforeBuild` - Abstraction for the hook
- `ApiBeforeBuild.Interface` - TypeScript interface
- `ApiBeforeBuild.Params` - Parameters interface
- `ApiBeforeBuild.createImplementation()` - Method to create implementations

---

#### `Infra.Api.AfterBuild`

Execute logic after the API app build completes.

**Import Path:** `webiny/infra/features/ApiAfterBuild`

---

#### `Infra.Api.BeforeDeploy`

Execute logic before the API app deployment starts.

**Import Path:** `webiny/infra/features/ApiBeforeDeploy`

---

#### `Infra.Api.AfterDeploy`

Execute logic after the API app deployment completes.

**Import Path:** `webiny/infra/features/ApiAfterDeploy`

---

#### `Infra.Api.BeforeWatch`

Execute logic before the API app watch mode starts.

**Import Path:** `webiny/infra/features/ApiBeforeWatch`

---

### Core App Hooks

#### `Infra.Core.BeforeBuild`

Execute logic before the Core infrastructure build starts.

**Import Path:** `webiny/infra/features/CoreBeforeBuild`

---

#### `Infra.Core.AfterBuild`

Execute logic after the Core infrastructure build completes.

**Import Path:** `webiny/infra/features/CoreAfterBuild`

---

#### `Infra.Core.BeforeDeploy`

Execute logic before the Core infrastructure deployment starts.

**Import Path:** `webiny/infra/features/CoreBeforeDeploy`

---

#### `Infra.Core.AfterDeploy`

Execute logic after the Core infrastructure deployment completes.

**Import Path:** `webiny/infra/features/CoreAfterDeploy`

---

#### `Infra.Core.BeforeWatch`

Execute logic before the Core infrastructure watch mode starts (if applicable).

**Import Path:** `webiny/infra/features/CoreBeforeWatch`

---

## Infrastructure/Pulumi Extensions

These extensions allow you to customize the Pulumi infrastructure configuration.

### `Infra.Vpc`

Configure VPC (Virtual Private Cloud) settings for your Webiny deployment.

**Import Path:** `webiny/extensions`

**Usage:**
```tsx
import { Infra } from "webiny/extensions";

<Infra.Vpc enabled={true} />
```

---

### `Infra.ElasticSearch`

Configure ElasticSearch settings.

**Import Path:** `webiny/extensions`

**Usage:**
```tsx
import { Infra } from "webiny/extensions";

<Infra.ElasticSearch version="7.10" instanceType="t3.small.elasticsearch" />
```

---

### `Infra.OpenSearch`

Configure OpenSearch settings.

**Import Path:** `webiny/extensions`

**Usage:**
```tsx
import { Infra } from "webiny/extensions";

<Infra.OpenSearch version="2.5" instanceType="t3.small.search" />
```

---

### `Infra.AwsTags`

Add custom AWS tags to all resources.

**Import Path:** `webiny/extensions`

**Usage:**
```tsx
import { Infra } from "webiny/extensions";

<Infra.AwsTags tags={{ Environment: "production", Team: "platform" }} />
```

---

### `Infra.BlueGreenDeployments`

Configure blue-green deployment strategy.

**Import Path:** `webiny/extensions`

---

### `Infra.Admin.CustomDomains`

Configure custom domains for the Admin app.

**Import Path:** `webiny/extensions`

**Usage:**
```tsx
import { Infra } from "webiny/extensions";

<Infra.Admin.CustomDomains domains={["admin.example.com"]} />
```

---

### `Infra.PulumiResourceNamePrefix`

Set a prefix for all Pulumi resource names.

**Import Path:** `webiny/extensions`

**Usage:**
```tsx
import { Infra } from "webiny/extensions";

<Infra.PulumiResourceNamePrefix prefix="wby" />
```

---

### `Infra.ProductionEnvironments`

Define which environments should be treated as production.

**Import Path:** `webiny/extensions`

**Usage:**
```tsx
import { Infra } from "webiny/extensions";

<Infra.ProductionEnvironments environments={["prod", "production"]} />
```

---

### `Infra.Admin.Pulumi`

Customize the Admin app's Pulumi infrastructure.

**Import Path:** `webiny/infra/features/AdminPulumi`

**Exports:**
- `AdminPulumi` - Abstraction for the Pulumi customization
- `AdminPulumi.Interface` - TypeScript interface
- `AdminPulumi.Params` - Parameters interface
- `AdminPulumi.createImplementation()` - Method to create implementations

---

### `Infra.Api.Pulumi`

Customize the API app's Pulumi infrastructure.

**Import Path:** `webiny/infra/features/ApiPulumi`

**Exports:**
- `ApiPulumi` - Abstraction for the Pulumi customization
- `ApiPulumi.Interface` - TypeScript interface
- `ApiPulumi.Params` - Parameters interface
- `ApiPulumi.createImplementation()` - Method to create implementations

---

### `Infra.Core.Pulumi`

Customize the Core infrastructure's Pulumi configuration.

**Import Path:** `webiny/infra/features/CorePulumi`

**Exports:**
- `CorePulumi` - Abstraction for the Pulumi customization
- `CorePulumi.Interface` - TypeScript interface
- `CorePulumi.Params` - Parameters interface
- `CorePulumi.createImplementation()` - Method to create implementations

---

## CLI Extensions

### `Cli.Command`

Create custom CLI commands for your Webiny project.

**Import Path:** `webiny/extensions` or `webiny/cli/features/Command`

**Exports:**
- `Command` - Abstraction for CLI commands
- `Command.Interface` - TypeScript interface
- `Command.createImplementation()` - Method to create implementations

**Usage:**
```typescript
import { Command } from "webiny/cli/features/Command";

class MyCommandImpl implements Command.Interface {
    async execute(context) {
        console.log("Executing custom command");
        // Your command logic
    }
}

export const MyCommand = Command.createImplementation({
    implementation: MyCommandImpl,
    dependencies: []
});
```

---

### `Cli.Ui`

Access UI utilities for CLI output.

**Import Path:** `webiny/cli/features/Ui`

**Exports:**
- `Ui` - Service abstraction for CLI UI utilities
- `Ui.Interface` - TypeScript interface with methods for formatted output

---

## Admin UI Extensions

### `Admin.Extension`

Create extensions for the Admin UI.

**Import Path:** `webiny/extensions`

**Usage:**
```tsx
import { Admin } from "webiny/extensions";

<Admin.Extension
    name="my-admin-feature"
    component={() => <div>My Custom Admin Feature</div>}
/>
```

---

## Security Extensions

### `Security.ApiKey.AfterCreate`

Execute custom logic after an API key is created.

**Import Path:** `webiny/extensions`

**Usage:**
```tsx
import { Security } from "webiny/extensions";

<Security.ApiKey.AfterCreate src="./path/to/handler.ts" />
```

**Extension Definition:**
This extension allows you to add custom logic that runs after an API key is created. The source file should export an implementation of the `ApiKeyAfterCreateHandler` interface.

---

## API Features - System & Settings

### `InstallSystem`

**Import Path:** `webiny/api/features/InstallSystem`

System installation abstractions and use cases.

**Exports:**
- `InstallSystemUseCase` - Abstraction for system installation
- `InstallSystemUseCase.Interface` - TypeScript interface
- `InstallSystemUseCase.Error` - Error types
- `SystemBeforeInstallEvent` - Event triggered before system installation
- `SystemAfterInstallEvent` - Event triggered after system installation
- `SystemBeforeInstallHandler` - Handler abstraction for before install
- `SystemAfterInstallHandler` - Handler abstraction for after install

---

### `GetSettings`

**Import Path:** `webiny/api/features/GetSettings`

Retrieve system settings.

**Exports:**
- `GetSettingsUseCase` - Abstraction for getting settings
- `GetSettingsUseCase.Interface` - TypeScript interface
- `GetSettingsUseCase.Error` - Error types

---

### `UpdateSettings`

**Import Path:** `webiny/api/features/UpdateSettings`

Update system settings.

**Exports:**
- `UpdateSettingsUseCase` - Abstraction for updating settings
- `UpdateSettingsUseCase.Interface` - TypeScript interface
- `UpdateSettingsUseCase.Error` - Error types
- `SettingsBeforeUpdateEvent` - Event triggered before settings update
- `SettingsAfterUpdateEvent` - Event triggered after settings update
- `SettingsBeforeUpdateHandler` - Handler abstraction for before update
- `SettingsAfterUpdateHandler` - Handler abstraction for after update

---

### `DeleteSettings`

**Import Path:** `webiny/api/features/DeleteSettings`

Delete system settings.

**Exports:**
- `DeleteSettingsUseCase` - Abstraction for deleting settings
- `DeleteSettingsUseCase.Interface` - TypeScript interface
- `DeleteSettingsUseCase.Error` - Error types

---

### `EventPublisher`

**Import Path:** `webiny/api/features/eventPublisher`

Event publishing system for domain events.

**Exports:**
- `EventPublisher` - Abstraction for publishing events
- `IEventPublisher` - Interface for event publisher
- `IEventHandler` - Interface for event handlers
- `DomainEvent` - Base class for domain events

---

## API Features - Tenancy

### `InstallTenant`

**Import Path:** `webiny/api/tenancy/features/InstallTenant`

Tenant installation abstractions and use cases.

**Exports:**
- `InstallTenantUseCase` - Abstraction for tenant installation
- `InstallTenantUseCase.Interface` - TypeScript interface
- `InstallTenantUseCase.Error` - Error types
- `TenantBeforeInstallEvent` - Event triggered before tenant installation
- `TenantAfterInstallEvent` - Event triggered after tenant installation
- `TenantBeforeInstallHandler` - Handler abstraction for before install
- `TenantAfterInstallHandler` - Handler abstraction for after install

---

### `TenantContext`

**Import Path:** `webiny/api/tenancy/features/TenantContext`

Access tenant context information.

**Exports:**
- `TenantContext` - Abstraction for tenant context
- `TenantContext.Interface` - TypeScript interface with tenant information

---

## API Features - Security

### User Management

#### `CreateUser`

**Import Path:** `webiny/api/security/features/CreateUser`

Create a new user.

**Exports:**
- `CreateUserUseCase` - Abstraction for user creation
- `CreateUserUseCase.Interface` - TypeScript interface
- `CreateUserUseCase.Error` - Error types
- `UserBeforeCreateEvent` - Event triggered before user creation
- `UserAfterCreateEvent` - Event triggered after user creation
- `UserBeforeCreateHandler` - Handler abstraction for before create
- `UserAfterCreateHandler` - Handler abstraction for after create

---

#### `GetUser`

**Import Path:** `webiny/api/security/features/GetUser`

Retrieve a user by ID.

**Exports:**
- `GetUserUseCase` - Abstraction for getting a user
- `GetUserUseCase.Interface` - TypeScript interface
- `GetUserUseCase.Error` - Error types

---

#### `UpdateUser`

**Import Path:** `webiny/api/security/features/UpdateUser`

Update an existing user.

**Exports:**
- `UpdateUserUseCase` - Abstraction for user update
- `UpdateUserUseCase.Interface` - TypeScript interface
- `UpdateUserUseCase.Error` - Error types
- `UserBeforeUpdateEvent` - Event triggered before user update
- `UserAfterUpdateEvent` - Event triggered after user update
- `UserBeforeUpdateHandler` - Handler abstraction for before update
- `UserAfterUpdateHandler` - Handler abstraction for after update

---

#### `DeleteUser`

**Import Path:** `webiny/api/security/features/DeleteUser`

Delete a user.

**Exports:**
- `DeleteUserUseCase` - Abstraction for user deletion
- `DeleteUserUseCase.Interface` - TypeScript interface
- `DeleteUserUseCase.Error` - Error types
- `UserBeforeDeleteEvent` - Event triggered before user deletion
- `UserAfterDeleteEvent` - Event triggered after user deletion
- `UserBeforeDeleteHandler` - Handler abstraction for before delete
- `UserAfterDeleteHandler` - Handler abstraction for after delete

---

#### `ListUsers`

**Import Path:** `webiny/api/security/features/ListUsers`

List all users with pagination and filtering.

**Exports:**
- `ListUsersUseCase` - Abstraction for listing users
- `ListUsersUseCase.Interface` - TypeScript interface
- `ListUsersUseCase.Error` - Error types

---

### Group Management

#### `CreateGroup`

**Import Path:** `webiny/api/security/features/CreateGroup`

Create a new security group.

**Exports:**
- `CreateGroupUseCase` - Abstraction for group creation
- `CreateGroupUseCase.Interface` - TypeScript interface
- `CreateGroupUseCase.Error` - Error types
- `GroupBeforeCreateEvent` - Event triggered before group creation
- `GroupAfterCreateEvent` - Event triggered after group creation
- `GroupBeforeCreateHandler` - Handler abstraction for before create
- `GroupAfterCreateHandler` - Handler abstraction for after create

---

#### `GetGroup`

**Import Path:** `webiny/api/security/features/GetGroup`

Retrieve a group by ID or slug.

**Exports:**
- `GetGroupUseCase` - Abstraction for getting a group
- `GetGroupUseCase.Interface` - TypeScript interface
- `GetGroupUseCase.Error` - Error types

---

#### `UpdateGroup`

**Import Path:** `webiny/api/security/features/UpdateGroup`

Update an existing group.

**Exports:**
- `UpdateGroupUseCase` - Abstraction for group update
- `UpdateGroupUseCase.Interface` - TypeScript interface
- `UpdateGroupUseCase.Error` - Error types
- `GroupBeforeUpdateEvent` - Event triggered before group update
- `GroupAfterUpdateEvent` - Event triggered after group update
- `GroupBeforeUpdateHandler` - Handler abstraction for before update
- `GroupAfterUpdateHandler` - Handler abstraction for after update

---

#### `DeleteGroup`

**Import Path:** `webiny/api/security/features/DeleteGroup`

Delete a security group.

**Exports:**
- `DeleteGroupUseCase` - Abstraction for group deletion
- `DeleteGroupUseCase.Interface` - TypeScript interface
- `DeleteGroupUseCase.Error` - Error types
- `GroupBeforeDeleteEvent` - Event triggered before group deletion
- `GroupAfterDeleteEvent` - Event triggered after group deletion
- `GroupBeforeDeleteHandler` - Handler abstraction for before delete
- `GroupAfterDeleteHandler` - Handler abstraction for after delete

---

#### `ListGroups`

**Import Path:** `webiny/api/security/features/ListGroups`

List all security groups with pagination and filtering.

**Exports:**
- `ListGroupsUseCase` - Abstraction for listing groups
- `ListGroupsUseCase.Interface` - TypeScript interface
- `ListGroupsUseCase.Error` - Error types

---

### Team Management

#### `CreateTeam`

**Import Path:** `webiny/api/security/features/CreateTeam`

Create a new team.

**Exports:**
- `CreateTeamUseCase` - Abstraction for team creation
- `CreateTeamUseCase.Interface` - TypeScript interface
- `CreateTeamUseCase.Error` - Error types
- `TeamBeforeCreateEvent` - Event triggered before team creation
- `TeamAfterCreateEvent` - Event triggered after team creation
- `TeamBeforeCreateHandler` - Handler abstraction for before create
- `TeamAfterCreateHandler` - Handler abstraction for after create

---

#### `GetTeam`

**Import Path:** `webiny/api/security/features/GetTeam`

Retrieve a team by ID.

**Exports:**
- `GetTeamUseCase` - Abstraction for getting a team
- `GetTeamUseCase.Interface` - TypeScript interface
- `GetTeamUseCase.Error` - Error types

---

#### `UpdateTeam`

**Import Path:** `webiny/api/security/features/UpdateTeam`

Update an existing team.

**Exports:**
- `UpdateTeamUseCase` - Abstraction for team update
- `UpdateTeamUseCase.Interface` - TypeScript interface
- `UpdateTeamUseCase.Error` - Error types
- `TeamBeforeUpdateEvent` - Event triggered before team update
- `TeamAfterUpdateEvent` - Event triggered after team update
- `TeamBeforeUpdateHandler` - Handler abstraction for before update
- `TeamAfterUpdateHandler` - Handler abstraction for after update

---

#### `DeleteTeam`

**Import Path:** `webiny/api/security/features/DeleteTeam`

Delete a team.

**Exports:**
- `DeleteTeamUseCase` - Abstraction for team deletion
- `DeleteTeamUseCase.Interface` - TypeScript interface
- `DeleteTeamUseCase.Error` - Error types
- `TeamBeforeDeleteEvent` - Event triggered before team deletion
- `TeamAfterDeleteEvent` - Event triggered after team deletion
- `TeamBeforeDeleteHandler` - Handler abstraction for before delete
- `TeamAfterDeleteHandler` - Handler abstraction for after delete

---

#### `ListTeams`

**Import Path:** `webiny/api/security/features/ListTeams`

List all teams with pagination and filtering.

**Exports:**
- `ListTeamsUseCase` - Abstraction for listing teams
- `ListTeamsUseCase.Interface` - TypeScript interface
- `ListTeamsUseCase.Error` - Error types

---

#### `ListUserTeams`

**Import Path:** `webiny/api/security/features/ListUserTeams`

List all teams a user belongs to.

**Exports:**
- `ListUserTeamsUseCase` - Abstraction for listing user teams
- `ListUserTeamsUseCase.Interface` - TypeScript interface
- `ListUserTeamsUseCase.Error` - Error types

---

### API Key Management

#### `CreateApiKey`

**Import Path:** `webiny/api/security/features/CreateApiKey`

Create a new API key.

**Exports:**
- `CreateApiKeyUseCase` - Abstraction for API key creation
- `CreateApiKeyUseCase.Interface` - TypeScript interface
- `CreateApiKeyUseCase.Error` - Error types
- `ApiKeyBeforeCreateEvent` - Event triggered before API key creation
- `ApiKeyAfterCreateEvent` - Event triggered after API key creation
- `ApiKeyBeforeCreateHandler` - Handler abstraction for before create
- `ApiKeyAfterCreateHandler` - Handler abstraction for after create

---

#### `GetApiKey`

**Import Path:** `webiny/api/security/features/GetApiKey`

Retrieve an API key by ID.

**Exports:**
- `GetApiKeyUseCase` - Abstraction for getting an API key
- `GetApiKeyUseCase.Interface` - TypeScript interface
- `GetApiKeyUseCase.Error` - Error types

---

#### `GetApiKeyByToken`

**Import Path:** `webiny/api/security/features/GetApiKeyByToken`

Retrieve an API key by its token.

**Exports:**
- `GetApiKeyByTokenUseCase` - Abstraction for getting an API key by token
- `GetApiKeyByTokenUseCase.Interface` - TypeScript interface
- `GetApiKeyByTokenUseCase.Error` - Error types

---

#### `UpdateApiKey`

**Import Path:** `webiny/api/security/features/UpdateApiKey`

Update an existing API key.

**Exports:**
- `UpdateApiKeyUseCase` - Abstraction for API key update
- `UpdateApiKeyUseCase.Interface` - TypeScript interface
- `UpdateApiKeyUseCase.Error` - Error types
- `ApiKeyBeforeUpdateEvent` - Event triggered before API key update
- `ApiKeyAfterUpdateEvent` - Event triggered after API key update
- `ApiKeyBeforeUpdateHandler` - Handler abstraction for before update
- `ApiKeyAfterUpdateHandler` - Handler abstraction for after update

---

#### `DeleteApiKey`

**Import Path:** `webiny/api/security/features/DeleteApiKey`

Delete an API key.

**Exports:**
- `DeleteApiKeyUseCase` - Abstraction for API key deletion
- `DeleteApiKeyUseCase.Interface` - TypeScript interface
- `DeleteApiKeyUseCase.Error` - Error types
- `ApiKeyBeforeDeleteEvent` - Event triggered before API key deletion
- `ApiKeyAfterDeleteEvent` - Event triggered after API key deletion
- `ApiKeyBeforeDeleteHandler` - Handler abstraction for before delete
- `ApiKeyAfterDeleteHandler` - Handler abstraction for after delete

---

#### `ListApiKeys`

**Import Path:** `webiny/api/security/features/ListApiKeys`

List all API keys with pagination and filtering.

**Exports:**
- `ListApiKeysUseCase` - Abstraction for listing API keys
- `ListApiKeysUseCase.Interface` - TypeScript interface
- `ListApiKeysUseCase.Error` - Error types

---

### Tenant Links Management

#### `CreateTenantLinks`

**Import Path:** `webiny/api/security/features/CreateTenantLinks`

Create links between identities and tenants.

**Exports:**
- `CreateTenantLinksUseCase` - Abstraction for tenant link creation
- `CreateTenantLinksUseCase.Interface` - TypeScript interface
- `CreateTenantLinksUseCase.Error` - Error types

---

#### `UpdateTenantLinks`

**Import Path:** `webiny/api/security/features/UpdateTenantLinks`

Update existing tenant links.

**Exports:**
- `UpdateTenantLinksUseCase` - Abstraction for tenant link update
- `UpdateTenantLinksUseCase.Interface` - TypeScript interface
- `UpdateTenantLinksUseCase.Error` - Error types

---

#### `DeleteTenantLinks`

**Import Path:** `webiny/api/security/features/DeleteTenantLinks`

Delete tenant links.

**Exports:**
- `DeleteTenantLinksUseCase` - Abstraction for tenant link deletion
- `DeleteTenantLinksUseCase.Interface` - TypeScript interface
- `DeleteTenantLinksUseCase.Error` - Error types

---

#### `GetTenantLinkByIdentity`

**Import Path:** `webiny/api/security/features/GetTenantLinkByIdentity`

Retrieve a tenant link by identity.

**Exports:**
- `GetTenantLinkByIdentityUseCase` - Abstraction for getting a tenant link
- `GetTenantLinkByIdentityUseCase.Interface` - TypeScript interface
- `GetTenantLinkByIdentityUseCase.Error` - Error types

---

#### `ListTenantLinksByIdentity`

**Import Path:** `webiny/api/security/features/ListTenantLinksByIdentity`

List all tenant links for a specific identity.

**Exports:**
- `ListTenantLinksByIdentityUseCase` - Abstraction for listing tenant links
- `ListTenantLinksByIdentityUseCase.Interface` - TypeScript interface
- `ListTenantLinksByIdentityUseCase.Error` - Error types

---

#### `ListTenantLinksByTenant`

**Import Path:** `webiny/api/security/features/ListTenantLinksByTenant`

List all tenant links for a specific tenant.

**Exports:**
- `ListTenantLinksByTenantUseCase` - Abstraction for listing tenant links
- `ListTenantLinksByTenantUseCase.Interface` - TypeScript interface
- `ListTenantLinksByTenantUseCase.Error` - Error types

---

#### `ListTenantLinksByType`

**Import Path:** `webiny/api/security/features/ListTenantLinksByType`

List all tenant links by link type.

**Exports:**
- `ListTenantLinksByTypeUseCase` - Abstraction for listing tenant links
- `ListTenantLinksByTypeUseCase.Interface` - TypeScript interface
- `ListTenantLinksByTypeUseCase.Error` - Error types

---

### Authentication & Authorization

#### `AuthenticationContext`

**Import Path:** `webiny/api/security/features/AuthenticationContext`

Access authentication context information.

**Exports:**
- `AuthenticationContext` - Abstraction for authentication context
- `AuthenticationContext.Interface` - TypeScript interface with authentication methods

---

#### `AuthorizationContext`

**Import Path:** `webiny/api/security/features/AuthorizationContext`

Access authorization context information.

**Exports:**
- `AuthorizationContext` - Abstraction for authorization context
- `AuthorizationContext.Interface` - TypeScript interface with authorization methods

---

#### `IdentityContext`

**Import Path:** `webiny/api/security/features/IdentityContext`

Access identity context information (current user/API key).

**Exports:**
- `IdentityContext` - Abstraction for identity context
- `IdentityContext.Interface` - TypeScript interface with identity information

---

#### `Authenticator`

**Import Path:** `webiny/api/security/features/Authenticator`

Implement custom authentication strategies.

**Exports:**
- `Authenticator` - Abstraction for authentication
- `Authenticator.Interface` - TypeScript interface
- `Authenticator.createImplementation()` - Method to create implementations

---

#### `Authorizer`

**Import Path:** `webiny/api/security/features/Authorizer`

Implement custom authorization strategies.

**Exports:**
- `Authorizer` - Abstraction for authorization
- `Authorizer.Interface` - TypeScript interface
- `Authorizer.createImplementation()` - Method to create implementations

---

#### `ExternalIdpUserSync`

**Import Path:** `webiny/api/security/features/ExternalIdpUserSync`

Synchronize users from external identity providers.

**Exports:**
- `ExternalIdpUserSync` - Abstraction for user synchronization
- `ExternalIdpUserSync.Interface` - TypeScript interface
- `ExternalIdpUserSync.createImplementation()` - Method to create implementations

---

## API Features - WCP (Webiny Control Panel)

### `WcpContext`

**Import Path:** `webiny/api/wcp/WcpContext`

Access Webiny Control Panel context and utilities.

**Exports:**
- `WcpContext` - Abstraction for WCP context
- `WcpContext.Interface` - TypeScript interface with WCP methods and data

---

## CLI Features

### `Command`

**Import Path:** `webiny/cli/features/Command`

Create custom CLI commands. (Same as `Cli.Command`)

**Exports:**
- `Command` - Abstraction for CLI commands
- `Command.Interface` - TypeScript interface
- `Command.createImplementation()` - Method to create implementations

---

### `Ui`

**Import Path:** `webiny/cli/features/Ui`

Access CLI UI utilities. (Same as `Cli.Ui`)

**Exports:**
- `Ui` - Service abstraction for CLI UI
- `Ui.Interface` - TypeScript interface with UI methods like:
  - `success(message: string): void`
  - `error(message: string): void`
  - `warning(message: string): void`
  - `info(message: string): void`
  - `spinner(): SpinnerInterface`

---

## Services

### `LoggerService`

**Import Path:** `webiny/infra/features/LoggerService`

Logging service abstraction for structured logging.

**Exports:**
- `LoggerService` - Abstraction for logger
- `LoggerService.Interface` - TypeScript interface with methods:
  - `trace(objOrMsg, ...args): void`
  - `debug(objOrMsg, ...args): void`
  - `info(objOrMsg, ...args): void`
  - `warn(objOrMsg, ...args): void`
  - `error(objOrMsg, ...args): void`
  - `fatal(objOrMsg, ...args): void`
  - `log(objOrMsg, ...args): void`

**Usage:**
```typescript
import { LoggerService } from "webiny/infra/features/LoggerService";

class MyService {
    constructor(private logger: LoggerService.Interface) {}

    doSomething() {
        this.logger.info("Doing something...");
    }
}
```

---

### `UiService`

**Import Path:** `webiny/infra/features/UiService`

UI service abstraction for user interaction during build/deploy.

**Exports:**
- `UiService` - Abstraction for UI service
- `UiService.Interface` - TypeScript interface with UI methods

**Usage:**
```typescript
import { UiService } from "webiny/infra/features/UiService";

class MyDeployHook {
    constructor(private ui: UiService.Interface) {}

    async execute() {
        this.ui.info("Starting deployment...");
        this.ui.success("Deployment complete!");
    }
}
```

---

## Type Utilities

### `Result<T, E>`

The Webiny API uses a `Result<T, E>` type for error handling instead of throwing exceptions. This is available from feature imports.

**Usage:**
```typescript
import { Result } from "@webiny/feature/api";
import { CreateGroupUseCase } from "webiny/api/security/features/CreateGroup";

// In your implementation
async function handleCreateGroup(
    useCase: CreateGroupUseCase.Interface
): Promise<void> {
    const result = await useCase.execute({ name: "Editors" });
    
    if (result.isOk()) {
        const group = result.value;
        console.log("Group created:", group.id);
    } else {
        const error = result.error;
        console.error("Failed to create group:", error);
    }
}
```

---

## Import Patterns

### Main Entry Point

```typescript
// Import infrastructure, project, and security configurations
import { Infra, Project, Security, Admin, Cli } from "webiny/extensions";
```

### Feature Imports

```typescript
// Import specific features
import { CreateUser } from "webiny/api/security/features/CreateUser";
import { BeforeBuild } from "webiny/infra/features/BeforeBuild";
import { LoggerService } from "webiny/infra/features/LoggerService";
```

### Service Imports

```typescript
// Import services
import { LoggerService, UiService } from "webiny/infra/features";
```

---

## Extension Development Pattern

All Webiny features follow a consistent pattern for extensibility:

1. **Abstraction**: A typed interface defining the contract
2. **Implementation**: Your custom implementation of the interface
3. **Registration**: Register your implementation using `createImplementation()`
4. **Dependencies**: Declare dependencies that will be injected

**Example:**
```typescript
import { BeforeBuild } from "webiny/infra/features/BeforeBuild";
import { LoggerService } from "webiny/infra/features/LoggerService";

// 1. Define your implementation class
class MyBeforeBuildImpl implements BeforeBuild.Interface {
    constructor(private logger: LoggerService.Interface) {}

    async execute(params: BeforeBuild.Params) {
        this.logger.info(`Building app: ${params.app}`);
        // Your custom logic here
    }
}

// 2. Register your implementation
export const MyBeforeBuild = BeforeBuild.createImplementation({
    implementation: MyBeforeBuildImpl,
    dependencies: [LoggerService]
});
```

---

## Event-Driven Architecture

Many features support event-driven customization through before/after event handlers:

**Example:**
```typescript
import { 
    GroupAfterCreateHandler,
    GroupAfterCreateEvent 
} from "webiny/api/security/features/CreateGroup";
import { LoggerService } from "webiny/infra/features/LoggerService";

class NotifyOnGroupCreateImpl implements GroupAfterCreateHandler.Interface {
    constructor(private logger: LoggerService.Interface) {}

    async handle(event: GroupAfterCreateEvent) {
        const { group } = event.payload;
        this.logger.info(`New group created: ${group.name}`);
        // Send notification, update cache, etc.
    }
}

export const NotifyOnGroupCreate = GroupAfterCreateHandler.createImplementation({
    implementation: NotifyOnGroupCreateImpl,
    dependencies: [LoggerService]
});
```

---

## Best Practices

1. **Use TypeScript**: All Webiny APIs are fully typed. Leverage TypeScript for better development experience.

2. **Dependency Injection**: Always declare dependencies in the `dependencies` array rather than importing directly.

3. **Result Type**: When calling use cases, always check the `Result` type:
   ```typescript
   const result = await useCase.execute(input);
   if (result.isOk()) {
       // Handle success
   } else {
       // Handle error
   }
   ```

4. **Event Handlers**: Use event handlers for cross-cutting concerns rather than modifying core logic.

5. **Extension Organization**: Keep extensions organized by domain (security, tenancy, etc.).

---

## Additional Resources

- **Official Documentation**: https://www.webiny.com/docs
- **GitHub Repository**: https://github.com/webiny/webiny-js
- **Community Slack**: https://www.webiny.com/slack

---

**Last Updated:** November 14, 2025
**Package Version:** 0.0.0 (Pre-release)

