---
name: webiny-lifecycle-events
context: webiny-extensions
description: >
  CMS entry lifecycle hooks and security event handlers.
  Use this skill when the developer wants to intercept content entry operations
  (create, update, delete, publish, unpublish), validate data before save, auto-calculate
  fields, send notifications after operations, enforce security policies, sync with external
  systems, or hook into API key updates. Covers before/after hooks, event filtering by modelId,
  payload mutation, and the Logger/BuildParams DI services.
---

# Lifecycle Events

## TL;DR

Webiny fires lifecycle events before and after CMS entry operations (create, update, delete, publish, unpublish) and security operations (API key updates). You hook into these by implementing the corresponding `EventHandler.Interface`, filtering by `modelId`, and optionally mutating `payload.values` before data is saved. Register as `<Api.Extension>`.

## CMS Entry Lifecycle Events

### Available Hooks

| Hook | Import From | Fires When |
|---|---|---|
| `EntryBeforeCreateEventHandler` | `"webiny/api/cms/entry"` | Before a new entry is saved |
| `EntryAfterCreateEventHandler` | `"webiny/api/cms/entry"` | After a new entry is saved |
| `EntryBeforeUpdateEventHandler` | `"webiny/api/cms/entry"` | Before an existing entry is updated |
| `EntryAfterUpdateEventHandler` | `"webiny/api/cms/entry"` | After an existing entry is updated |
| `EntryBeforeDeleteEventHandler` | `"webiny/api/cms/entry"` | Before an entry is deleted |
| `EntryAfterDeleteEventHandler` | `"webiny/api/cms/entry"` | After an entry is deleted |
| `EntryBeforePublishEventHandler` | `"webiny/api/cms/entry"` | Before an entry is published |
| `EntryAfterPublishEventHandler` | `"webiny/api/cms/entry"` | After an entry is published |

### The Event Object

Every handler receives an `event` with:

- `event.modelId` -- The model ID string (e.g., `"contactSubmission"`)
- `event.payload` -- The entry data object
- `event.payload.values` -- The field values (can be mutated in `before` hooks)

### Pattern

```typescript
import { EntryBeforeCreateEventHandler as Handler } from "webiny/api/cms/entry";

class MyHookImpl implements Handler.Interface {
    async handle(event: Handler.Event): Promise<void> {
        const { payload, modelId } = event;

        // 1. Filter by model -- handlers fire for ALL models
        if (modelId !== "myTargetModel") {
            return;
        }

        // 2. Read values
        const someField = payload.values?.someField as string;

        // 3. Mutate values (before hooks only)
        if (!payload.values) {
            payload.values = {};
        }
        payload.values.computedField = "computed value";
    }
}

export default Handler.createImplementation({
    implementation: MyHookImpl,
    dependencies: []
});
```

Register in `webiny.config.tsx`:

```tsx
<Api.Extension src={"/extensions/MyHook.ts"} />
```

### When to Use Before vs After

| Use Case | Hook Type | Why |
|---|---|---|
| Validate data | `Before` | Reject or modify before persistence |
| Auto-calculate fields | `Before` | Set computed values before save |
| Send email notification | `After` | Ensure data is persisted first |
| Sync with external CRM | `After` | Side effect after successful save |
| Enforce security policies | `Before` | Block operations before they happen |

## Full Example: Email Classification Hook

This hook intercepts contact form submissions, checks the email domain, and automatically classifies it as "work" or "personal":

```typescript
// extensions/contactSubmission/ContactSubmissionHook.ts
import { EntryBeforeCreateEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

const PERSONAL_EMAIL_DOMAINS = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "aol.com",
    "icloud.com",
    "protonmail.com"
];

class ContactSubmissionHookImpl implements Handler.Interface {
    public constructor(private logger: Logger.Interface) {}

    public async handle(event: Handler.Event): Promise<void> {
        const { payload, modelId } = event;

        // Only run for Contact Submission entries
        if (modelId !== "contactSubmission") {
            return;
        }

        this.logger.info(`Processing contact submission for model: ${modelId}`);

        const email = payload.values?.email as string;
        if (!email) {
            this.logger.warn("No email found in contact submission");
            return;
        }

        // Classify the email
        const domain = email.split("@")[1]?.toLowerCase();
        let type = "work";
        if (domain && PERSONAL_EMAIL_DOMAINS.includes(domain)) {
            type = "personal";
        }

        this.logger.info(`Classified email ${email} as ${type}`);

        // Set the emailType field before the entry is saved
        if (!payload.values) {
            payload.values = {};
        }
        payload.values.emailType = type;
    }
}

export default Handler.createImplementation({
    implementation: ContactSubmissionHookImpl,
    dependencies: [Logger]
});
```

## Security Lifecycle Events

### API Key After Update

```typescript
// extensions/MyApiKeyAfterUpdate.ts
import { ApiKeyAfterUpdateEventHandler } from "webiny/api/security/api-key";
import { Logger } from "webiny/api/logger";
import { BuildParams } from "webiny/api/build-params";

class MyApiKeyAfterUpdateImpl implements ApiKeyAfterUpdateEventHandler.Interface {
    constructor(
        private logger: Logger.Interface,
        private buildParams: BuildParams.Interface
    ) {}

    async handle() {
        this.logger.warn("An API key was updated!");

        const param1 = this.buildParams.get<string>("MY_CUSTOM_BUILD_PARAM");
        console.log(`Build param 1: ${param1}`);
    }
}

const MyApiKeyAfterUpdate = ApiKeyAfterUpdateEventHandler.createImplementation({
    implementation: MyApiKeyAfterUpdateImpl,
    dependencies: [Logger, BuildParams]
});

export default MyApiKeyAfterUpdate;
```

Register with a dedicated JSX element:

```tsx
<Security.ApiKey.AfterUpdate src={"/extensions/MyApiKeyAfterUpdate.ts"} />
```

## All Available Event Handlers

### `webiny/api/cms/entry`

| Handler | Fires When |
| --- | --- |
| `EntryBeforeCreateEventHandler` | Before a new entry is saved |
| `EntryAfterCreateEventHandler` | After a new entry is saved |
| `EntryRevisionBeforeCreateEventHandler` | Before a revision is created |
| `EntryRevisionAfterCreateEventHandler` | After a revision is created |
| `EntryBeforeUpdateEventHandler` | Before an entry is updated |
| `EntryAfterUpdateEventHandler` | After an entry is updated |
| `EntryBeforeDeleteEventHandler` | Before an entry is deleted |
| `EntryAfterDeleteEventHandler` | After an entry is deleted |
| `EntryRevisionBeforeDeleteEventHandler` | Before a revision is deleted |
| `EntryRevisionAfterDeleteEventHandler` | After a revision is deleted |
| `EntryBeforeDeleteMultipleEventHandler` | Before multiple entries are deleted |
| `EntryAfterDeleteMultipleEventHandler` | After multiple entries are deleted |
| `EntryBeforeMoveEventHandler` | Before an entry is moved |
| `EntryAfterMoveEventHandler` | After an entry is moved |
| `EntryBeforePublishEventHandler` | Before an entry is published |
| `EntryAfterPublishEventHandler` | After an entry is published |
| `EntryBeforeRepublishEventHandler` | Before an entry is republished |
| `EntryAfterRepublishEventHandler` | After an entry is republished |
| `EntryBeforeRestoreFromBinEventHandler` | Before an entry is restored from bin |
| `EntryAfterRestoreFromBinEventHandler` | After an entry is restored from bin |
| `EntryBeforeUnpublishEventHandler` | Before an entry is unpublished |
| `EntryAfterUnpublishEventHandler` | After an entry is unpublished |

### `webiny/api/cms/model`

| Handler | Fires When |
| --- | --- |
| `ModelBeforeCreateEventHandler` | Before a model is created |
| `ModelAfterCreateEventHandler` | After a model is created |
| `ModelBeforeCreateFromEventHandler` | Before a model is cloned |
| `ModelAfterCreateFromEventHandler` | After a model is cloned |
| `ModelBeforeUpdateEventHandler` | Before a model is updated |
| `ModelAfterUpdateEventHandler` | After a model is updated |
| `ModelBeforeDeleteEventHandler` | Before a model is deleted |
| `ModelAfterDeleteEventHandler` | After a model is deleted |

### `webiny/api/cms/group`

| Handler | Fires When |
| --- | --- |
| `GroupBeforeCreateEventHandler` | Before a group is created |
| `GroupAfterCreateEventHandler` | After a group is created |
| `GroupBeforeUpdateEventHandler` | Before a group is updated |
| `GroupAfterUpdateEventHandler` | After a group is updated |
| `GroupBeforeDeleteEventHandler` | Before a group is deleted |
| `GroupAfterDeleteEventHandler` | After a group is deleted |

### `webiny/api/security/authentication`

| Handler | Fires When |
| --- | --- |
| `BeforeAuthenticationEventHandler` | Before authentication |
| `AfterAuthenticationEventHandler` | After authentication |

### `webiny/api/security/api-key`

| Handler | Fires When |
| --- | --- |
| `ApiKeyBeforeCreateEventHandler` | Before an API key is created |
| `ApiKeyAfterCreateEventHandler` | After an API key is created |
| `ApiKeyBeforeDeleteEventHandler` | Before an API key is deleted |
| `ApiKeyAfterDeleteEventHandler` | After an API key is deleted |
| `ApiKeyBeforeUpdateEventHandler` | Before an API key is updated |
| `ApiKeyAfterUpdateEventHandler` | After an API key is updated |

### `webiny/api/security/role`

| Handler | Fires When |
| --- | --- |
| `RoleBeforeCreateEventHandler` | Before a role is created |
| `RoleAfterCreateEventHandler` | After a role is created |
| `RoleBeforeDeleteEventHandler` | Before a role is deleted |
| `RoleAfterDeleteEventHandler` | After a role is deleted |
| `RoleBeforeUpdateEventHandler` | Before a role is updated |
| `RoleAfterUpdateEventHandler` | After a role is updated |

### `webiny/api/security/user`

| Handler | Fires When |
| --- | --- |
| `UserBeforeCreateEventHandler` | Before a user is created |
| `UserAfterCreateEventHandler` | After a user is created |
| `UserBeforeDeleteEventHandler` | Before a user is deleted |
| `UserAfterDeleteEventHandler` | After a user is deleted |
| `UserBeforeUpdateEventHandler` | Before a user is updated |
| `UserAfterUpdateEventHandler` | After a user is updated |

### `webiny/api/tenancy`

| Handler | Fires When |
| --- | --- |
| `TenantBeforeCreateEventHandler` | Before a tenant is created |
| `TenantAfterCreateEventHandler` | After a tenant is created |
| `TenantBeforeUpdateEventHandler` | Before a tenant is updated |
| `TenantAfterUpdateEventHandler` | After a tenant is updated |
| `TenantBeforeDeleteEventHandler` | Before a tenant is deleted |
| `TenantAfterDeleteEventHandler` | After a tenant is deleted |
| `TenantInstalledEventHandler` | After a tenant is installed |

### `webiny/api/system`

| Handler | Fires When |
| --- | --- |
| `SystemInstalledEventHandler` | After the system is installed |

### `webiny/api/website-builder/page`

| Handler | Fires When |
| --- | --- |
| `PageBeforeCreateEventHandler` | Before a page is created |
| `PageAfterCreateEventHandler` | After a page is created |
| `PageBeforeCreateRevisionFromEventHandler` | Before a page revision is created |
| `PageAfterCreateRevisionFromEventHandler` | After a page revision is created |
| `PageBeforeDeleteEventHandler` | Before a page is deleted |
| `PageAfterDeleteEventHandler` | After a page is deleted |
| `PageBeforeDuplicateEventHandler` | Before a page is duplicated |
| `PageAfterDuplicateEventHandler` | After a page is duplicated |
| `PageBeforeMoveEventHandler` | Before a page is moved |
| `PageAfterMoveEventHandler` | After a page is moved |
| `PageBeforePublishEventHandler` | Before a page is published |
| `PageAfterPublishEventHandler` | After a page is published |
| `PageBeforeUnpublishEventHandler` | Before a page is unpublished |
| `PageAfterUnpublishEventHandler` | After a page is unpublished |
| `PageBeforeUpdateEventHandler` | Before a page is updated |
| `PageAfterUpdateEventHandler` | After a page is updated |

### `webiny/api/website-builder/redirect`

| Handler | Fires When |
| --- | --- |
| `RedirectBeforeCreateEventHandler` | Before a redirect is created |
| `RedirectAfterCreateEventHandler` | After a redirect is created |
| `RedirectBeforeDeleteEventHandler` | Before a redirect is deleted |
| `RedirectAfterDeleteEventHandler` | After a redirect is deleted |
| `RedirectBeforeMoveEventHandler` | Before a redirect is moved |
| `RedirectAfterMoveEventHandler` | After a redirect is moved |
| `RedirectBeforeUpdateEventHandler` | Before a redirect is updated |
| `RedirectAfterUpdateEventHandler` | After a redirect is updated |

## Quick Reference

```
CMS hooks import:   import { EntryBeforeCreateEventHandler } from "webiny/api/cms/entry";
Security import:    import { ApiKeyAfterUpdateEventHandler } from "webiny/api/security/api-key";
Event shape:        event.modelId (string), event.payload (object), event.payload.values (object)
Export:             Handler.createImplementation({ implementation, dependencies })
Register CMS:       <Api.Extension src={"/extensions/MyHook.ts"} />
Register Security:  <Security.ApiKey.AfterUpdate src={"/extensions/MyHook.ts"} />
Deploy:             yarn webiny deploy api
```

## Related Skills

- `content-models` -- Define the models your hooks target
- `dependency-injection` -- Inject Logger, BuildParams, and other services into event handlers
