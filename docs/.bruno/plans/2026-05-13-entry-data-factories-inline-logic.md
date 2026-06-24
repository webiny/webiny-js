# Entry Data Factories — Inline Logic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all logic from `crud/contentEntry/entryDataFactories/` into the DI factory implementations under `features/contentEntry/entryDataFactories/`, delete the old directory, and wire all 6 use cases to inject factory tokens instead of calling the old functions directly.

**Architecture:** Three shared helper files (`statuses.ts`, `system.ts`, `mapAndCleanUpdatedInputData.ts`) move to the `features/contentEntry/entryDataFactories/` parent level. Each factory's `Impl` class absorbs the logic from its old function, keeping private helpers as module-scope functions. Use cases drop their context dependencies (IdentityContext, TenantContext, CmsContext) where those were only needed to pass to the old function, and inject the factory token instead.

**Tech Stack:** TypeScript, `@webiny/feature/api` (`createImplementation`, `createAbstraction`), Webiny DI container.

---

## Files Overview

**Create:**
- `packages/api-headless-cms/src/features/contentEntry/entryDataFactories/statuses.ts`
- `packages/api-headless-cms/src/features/contentEntry/entryDataFactories/system.ts`
- `packages/api-headless-cms/src/features/contentEntry/entryDataFactories/mapAndCleanUpdatedInputData.ts`

**Rewrite (inline logic, drop old import):**
- `packages/api-headless-cms/src/features/contentEntry/entryDataFactories/CreateEntryDataFactory/CreateEntryDataFactory.ts`
- `packages/api-headless-cms/src/features/contentEntry/entryDataFactories/UpdateEntryDataFactory/UpdateEntryDataFactory.ts`
- `packages/api-headless-cms/src/features/contentEntry/entryDataFactories/CreateEntryRevisionFromDataFactory/CreateEntryRevisionFromDataFactory.ts`
- `packages/api-headless-cms/src/features/contentEntry/entryDataFactories/CreatePublishEntryDataFactory/CreatePublishEntryDataFactory.ts`
- `packages/api-headless-cms/src/features/contentEntry/entryDataFactories/CreateUnpublishEntryDataFactory/CreateUnpublishEntryDataFactory.ts`
- `packages/api-headless-cms/src/features/contentEntry/entryDataFactories/CreateRepublishEntryDataFactory/CreateRepublishEntryDataFactory.ts`

**Rewrite (wire factory token, drop context deps that are no longer needed):**
- `packages/api-headless-cms/src/features/contentEntry/CreateEntry/CreateEntryUseCase.ts`
- `packages/api-headless-cms/src/features/contentEntry/UpdateEntry/UpdateEntryUseCase.ts`
- `packages/api-headless-cms/src/features/contentEntry/CreateEntryRevisionFrom/CreateEntryRevisionFromUseCase.ts`
- `packages/api-headless-cms/src/features/contentEntry/PublishEntry/PublishEntryUseCase.ts`
- `packages/api-headless-cms/src/features/contentEntry/UnpublishEntry/UnpublishEntryUseCase.ts`
- `packages/api-headless-cms/src/features/contentEntry/RepublishEntry/RepublishEntryUseCase.ts`

**Modify (update import path only):**
- `packages/api-headless-cms/src/features/contentEntry/ValidateEntry/ValidateEntryUseCase.ts`

**Delete (entire directory, 10 files):**
- `packages/api-headless-cms/src/crud/contentEntry/entryDataFactories/`

---

## Task 1: Create shared files at the features level

These are identical copies of the shared helpers, moved from `crud/` to `features/`.

**Files:**
- Create: `packages/api-headless-cms/src/features/contentEntry/entryDataFactories/statuses.ts`
- Create: `packages/api-headless-cms/src/features/contentEntry/entryDataFactories/system.ts`
- Create: `packages/api-headless-cms/src/features/contentEntry/entryDataFactories/mapAndCleanUpdatedInputData.ts`

- [ ] **Step 1: Create `statuses.ts`**

```typescript
// packages/api-headless-cms/src/features/contentEntry/entryDataFactories/statuses.ts
import { CONTENT_ENTRY_STATUS } from "~/types/index.js";

export const STATUS_DRAFT = CONTENT_ENTRY_STATUS.DRAFT;
export const STATUS_PUBLISHED = CONTENT_ENTRY_STATUS.PUBLISHED;
export const STATUS_UNPUBLISHED = CONTENT_ENTRY_STATUS.UNPUBLISHED;
```

- [ ] **Step 2: Create `system.ts`**

```typescript
// packages/api-headless-cms/src/features/contentEntry/entryDataFactories/system.ts
import type { CmsEntry, ICmsEntrySystem } from "~/types/index.js";

interface IInputWithPossibleSystem {
    system: Partial<ICmsEntrySystem>;
}
interface IParams {
    input: Partial<IInputWithPossibleSystem>;
    original?: CmsEntry | null;
}

export const getSystem = ({ input, original }: IParams): ICmsEntrySystem | undefined => {
    if (!input.system) {
        return original?.system;
    }
    return {
        ...original?.system,
        ...input.system
    };
};
```

- [ ] **Step 3: Create `mapAndCleanUpdatedInputData.ts`**

```typescript
// packages/api-headless-cms/src/features/contentEntry/entryDataFactories/mapAndCleanUpdatedInputData.ts
import WebinyError from "@webiny/error";
import type { CmsEntryValues, CmsModel } from "~/types/index.js";

export const mapAndCleanUpdatedInputData = <TValues extends CmsEntryValues = CmsEntryValues>(
    model: CmsModel,
    input?: Partial<TValues>
) => {
    if (!input) {
        return {};
    }
    return model.fields.reduce<Partial<TValues>>((acc, field) => {
        if (!field.fieldId) {
            throw new WebinyError("Field does not have an fieldId.", "MISSING_FIELD_ID", {
                field
            });
        }
        const key = field.fieldId as keyof TValues;
        const value = input[key];
        if (value === undefined) {
            return acc;
        }
        acc[key] = value;
        return acc;
    }, {});
};
```

---

## Task 2: Inline `CreateEntryDataFactory`

Absorb the full body of `createEntryData()` into the `create()` method. Move private helpers to module scope. Import from the new shared files.

**Files:**
- Modify: `packages/api-headless-cms/src/features/contentEntry/entryDataFactories/CreateEntryDataFactory/CreateEntryDataFactory.ts`

- [ ] **Step 1: Replace the file with the inlined version**

```typescript
// packages/api-headless-cms/src/features/contentEntry/entryDataFactories/CreateEntryDataFactory/CreateEntryDataFactory.ts
import { createImplementation } from "@webiny/feature/api";
import {
    CreateEntryDataFactory as FactoryAbstraction,
    type ICreateEntryDataFactory,
    type ICreateEntryDataResponse
} from "./abstractions.js";
import { AccessControl, CmsContext } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CmsModelField,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "~/types/index.js";
import { getDate } from "~/utils/date.js";
import { ROOT_FOLDER } from "~/constants.js";
import WebinyError from "@webiny/error";
import { validateModelEntryDataOrThrow } from "~/crud/contentEntry/entryDataValidation.js";
import { referenceFieldsMapping } from "~/crud/contentEntry/referenceFieldsMapping.js";
import { createIdentifier, mdbid } from "@webiny/utils";
import { STATUS_DRAFT, STATUS_PUBLISHED, STATUS_UNPUBLISHED } from "../statuses.js";
import { getIdentity } from "~/utils/identity.js";
import { NotAuthorizedError } from "~/utils/errors.js";
import { getSystem } from "../system.js";

type DefaultValue = boolean | number | string | null;

const convertDefaultValue = (field: CmsModelField, value: DefaultValue): DefaultValue => {
    switch (field.type) {
        case "boolean":
            return Boolean(value);
        case "number":
            return Number(value);
        default:
            return value;
    }
};

const getDefaultValue = (field: CmsModelField): (DefaultValue | DefaultValue[]) | undefined => {
    const { settings, list } = field;
    if (settings && settings.defaultValue !== undefined) {
        return convertDefaultValue(field, settings.defaultValue);
    }
    const { predefinedValues } = field;
    if (
        !predefinedValues ||
        !predefinedValues.enabled ||
        Array.isArray(predefinedValues.values) === false
    ) {
        return undefined;
    }
    if (!list) {
        const selectedValue = predefinedValues.values.find(value => {
            return !!value.selected;
        });
        if (selectedValue) {
            return convertDefaultValue(field, selectedValue.value);
        }
        return undefined;
    }
    return predefinedValues.values
        .filter(({ selected }) => !!selected)
        .map(({ value }) => {
            return convertDefaultValue(field, value);
        });
};

const cleanInputValues = <TValues extends CmsEntryValues = CmsEntryValues>(
    model: CmsModel,
    input: TValues
) => {
    return model.fields.reduce<TValues>((acc, field) => {
        if (!field.fieldId) {
            throw new WebinyError("Field does not have an fieldId.", "MISSING_FIELD_ID", {
                field
            });
        }
        const key = field.fieldId as keyof TValues;
        const value = input[key] as TValues[keyof TValues];
        acc[key] = value === undefined ? (getDefaultValue(field) as TValues[keyof TValues]) : value;
        return acc;
    }, {} as TValues);
};

const createEntryId = (input: CreateCmsEntryInput) => {
    let entryId = mdbid();
    if (input.id) {
        if (input.id.match(/^([a-zA-Z0-9])([a-zA-Z0-9-]+)([a-zA-Z0-9])$/) === null) {
            throw new WebinyError(
                "The provided ID is not valid. It must be a string which can be A-Z, a-z, 0-9, - and it cannot start or end with a -.",
                "INVALID_ID",
                {
                    id: input.id
                }
            );
        }
        entryId = input.id;
    }
    const version = 1;
    return {
        entryId,
        version,
        id: createIdentifier({
            id: entryId,
            version
        })
    };
};

class CreateEntryDataFactoryImpl implements ICreateEntryDataFactory {
    public constructor(
        private readonly cmsContext: CmsContext.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly tenantContext: TenantContext.Interface,
        private readonly accessControl: AccessControl.Interface
    ) {}

    public async create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        rawInput: CreateCmsEntryInput<TValues>,
        options?: CreateCmsEntryOptionsInput
    ): Promise<ICreateEntryDataResponse<TValues>> {
        const initialValues = cleanInputValues<TValues>(model, rawInput.values || ({} as TValues));

        await validateModelEntryDataOrThrow({
            context: this.cmsContext,
            model,
            values: initialValues,
            skipValidators: options?.skipValidators
        });

        const values = await referenceFieldsMapping<TValues>({
            context: this.cmsContext,
            model,
            values: initialValues,
            validateEntries: true
        });

        const { id, entryId, version } = createEntryId(rawInput);

        const currentIdentity = this.identityContext.getIdentity();
        const currentDateTime = new Date();

        const status = rawInput.status || STATUS_DRAFT;
        if (status !== STATUS_DRAFT) {
            if (status === STATUS_PUBLISHED) {
                const canPublish = await this.accessControl.canAccessEntry({ model, pw: "p" });
                if (!canPublish) {
                    throw new NotAuthorizedError(
                        `Not allowed to access "${model.modelId}" entries.`
                    );
                }
            } else if (status === STATUS_UNPUBLISHED) {
                const canUnpublish = await this.accessControl.canAccessEntry({ model, pw: "u" });
                if (!canUnpublish) {
                    throw new NotAuthorizedError(
                        `Not allowed to access "${model.modelId}" entries.`
                    );
                }
            }
        }

        const locked = status !== STATUS_DRAFT;

        let revisionLevelPublishingMetaFields: Pick<
            CmsEntry,
            | "revisionFirstPublishedOn"
            | "revisionLastPublishedOn"
            | "revisionFirstPublishedBy"
            | "revisionLastPublishedBy"
        > = {
            revisionFirstPublishedOn: null,
            revisionLastPublishedOn: null,
            revisionFirstPublishedBy: null,
            revisionLastPublishedBy: null
        };

        let entryLevelPublishingMetaFields: Pick<
            CmsEntry,
            "firstPublishedOn" | "lastPublishedOn" | "firstPublishedBy" | "lastPublishedBy"
        > = {
            firstPublishedOn: null,
            lastPublishedOn: null,
            firstPublishedBy: null,
            lastPublishedBy: null
        };

        if (status === STATUS_PUBLISHED) {
            revisionLevelPublishingMetaFields = {
                revisionFirstPublishedOn: getDate(
                    rawInput.revisionFirstPublishedOn,
                    currentDateTime
                ),
                revisionLastPublishedOn: getDate(rawInput.revisionLastPublishedOn, currentDateTime),
                revisionFirstPublishedBy: getIdentity(
                    rawInput.revisionFirstPublishedBy,
                    currentIdentity
                ),
                revisionLastPublishedBy: getIdentity(
                    rawInput.revisionLastPublishedBy,
                    currentIdentity
                )
            };

            entryLevelPublishingMetaFields = {
                firstPublishedOn: getDate(rawInput.firstPublishedOn, currentDateTime),
                lastPublishedOn: getDate(rawInput.lastPublishedOn, currentDateTime),
                firstPublishedBy: getIdentity(rawInput.firstPublishedBy, currentIdentity),
                lastPublishedBy: getIdentity(rawInput.lastPublishedBy, currentIdentity)
            };
        }

        const entry: CmsEntry<TValues> = {
            tenant: this.tenantContext.getTenant().id,
            entryId,
            id,
            modelId: model.modelId,
            createdOn: getDate(rawInput.createdOn, currentDateTime),
            modifiedOn: getDate(rawInput.modifiedOn, null),
            savedOn: getDate(rawInput.savedOn, currentDateTime),
            deletedOn: getDate(rawInput.deletedOn, null),
            restoredOn: getDate(rawInput.restoredOn, null),
            createdBy: getIdentity(rawInput.createdBy, currentIdentity)!,
            modifiedBy: getIdentity(rawInput.modifiedBy, null),
            savedBy: getIdentity(rawInput.savedBy, currentIdentity)!,
            deletedBy: getIdentity(rawInput.deletedBy, null),
            restoredBy: getIdentity(rawInput.restoredBy, null),
            ...entryLevelPublishingMetaFields,
            revisionCreatedOn: getDate(rawInput.revisionCreatedOn, currentDateTime),
            revisionModifiedOn: getDate(rawInput.revisionModifiedOn, null),
            revisionSavedOn: getDate(rawInput.revisionSavedOn, currentDateTime),
            revisionDeletedOn: getDate(rawInput.revisionDeletedOn, null),
            revisionRestoredOn: getDate(rawInput.revisionRestoredOn, null),
            revisionCreatedBy: getIdentity(rawInput.revisionCreatedBy, currentIdentity)!,
            revisionModifiedBy: getIdentity(rawInput.revisionModifiedBy, null),
            revisionSavedBy: getIdentity(rawInput.revisionSavedBy, currentIdentity)!,
            revisionDeletedBy: getIdentity(rawInput.revisionDeletedBy, null),
            revisionRestoredBy: getIdentity(rawInput.revisionRestoredBy, null),
            ...revisionLevelPublishingMetaFields,
            version,
            status,
            locked,
            values,
            location: {
                folderId:
                    rawInput.location?.folderId ||
                    rawInput.wbyAco_location?.folderId ||
                    ROOT_FOLDER
            },
            system: getSystem({
                input: rawInput
            }),
            live:
                status === STATUS_PUBLISHED
                    ? {
                          version
                      }
                    : null,
            revisionDescription: ""
        };

        if (status !== STATUS_DRAFT) {
            if (status === STATUS_PUBLISHED) {
                const canPublish = await this.accessControl.canAccessEntry({
                    model,
                    entry,
                    pw: "p"
                });
                if (!canPublish) {
                    throw new NotAuthorizedError(`Not allowed to access entry "${entry.entryId}".`);
                }
            } else if (status === STATUS_UNPUBLISHED) {
                const canUnpublish = await this.accessControl.canAccessEntry({
                    model,
                    entry,
                    pw: "u"
                });
                if (!canUnpublish) {
                    throw new NotAuthorizedError(`Not allowed to access entry "${entry.entryId}".`);
                }
            }
        }

        return {
            entry,
            input: {
                ...rawInput,
                values: structuredClone(values)
            }
        };
    }
}

export const CreateEntryDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: CreateEntryDataFactoryImpl,
    dependencies: [CmsContext, IdentityContext, TenantContext, AccessControl]
});
```

---

## Task 3: Inline `UpdateEntryDataFactory`

**Files:**
- Modify: `packages/api-headless-cms/src/features/contentEntry/entryDataFactories/UpdateEntryDataFactory/UpdateEntryDataFactory.ts`

- [ ] **Step 1: Replace the file with the inlined version**

```typescript
// packages/api-headless-cms/src/features/contentEntry/entryDataFactories/UpdateEntryDataFactory/UpdateEntryDataFactory.ts
import { createImplementation } from "@webiny/feature/api";
import {
    UpdateEntryDataFactory as FactoryAbstraction,
    type IUpdateEntryDataFactory,
    type IUpdateEntryDataResponse
} from "./abstractions.js";
import { CmsContext } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type {
    CmsEntry,
    CmsEntryStatus,
    CmsEntryValues,
    CmsModel,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "~/types/index.js";
import { getDate } from "~/utils/date.js";
import { getIdentity } from "~/utils/identity.js";
import { validateModelEntryDataOrThrow } from "~/crud/contentEntry/entryDataValidation.js";
import { referenceFieldsMapping } from "~/crud/contentEntry/referenceFieldsMapping.js";
import { mapAndCleanUpdatedInputData } from "../mapAndCleanUpdatedInputData.js";
import lodashMerge from "lodash/merge.js";
import { removeNullValues, removeUndefinedValues } from "@webiny/utils";
import { getSystem } from "../system.js";

const allowedEntryStatus: string[] = ["draft", "published", "unpublished"];

const transformEntryStatus = (status: CmsEntryStatus | string): CmsEntryStatus => {
    return allowedEntryStatus.includes(status) ? (status as CmsEntryStatus) : "draft";
};

const createEntryMeta = (input?: Record<string, any>, original?: Record<string, any>) => {
    const meta = lodashMerge(original || {}, input || {});
    return removeUndefinedValues(removeNullValues(meta));
};

class UpdateEntryDataFactoryImpl implements IUpdateEntryDataFactory {
    public constructor(
        private readonly cmsContext: CmsContext.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly tenantContext: TenantContext.Interface
    ) {}

    public async create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        rawInput: UpdateCmsEntryInput<TValues>,
        originalEntry: CmsEntry<TValues>,
        options?: UpdateCmsEntryOptionsInput,
        metaInput?: Record<string, any>
    ): Promise<IUpdateEntryDataResponse<TValues>> {
        const cleanedValues = mapAndCleanUpdatedInputData<TValues>(
            model,
            rawInput?.values || ({} as TValues)
        );

        await validateModelEntryDataOrThrow({
            context: this.cmsContext,
            model,
            values: cleanedValues,
            entry: originalEntry,
            skipValidators: options?.skipValidators
        });

        const mergedValues: TValues = {
            ...originalEntry.values,
            ...cleanedValues
        };

        const values = await referenceFieldsMapping<TValues>({
            context: this.cmsContext,
            model,
            values: mergedValues,
            validateEntries: false
        });

        const meta = createEntryMeta(metaInput, originalEntry.meta);

        const currentIdentity = this.identityContext.getIdentity();
        const currentDateTime = new Date();

        const entry: CmsEntry<TValues> = {
            ...originalEntry,
            revisionCreatedOn: getDate(rawInput.revisionCreatedOn, originalEntry.revisionCreatedOn),
            revisionModifiedOn: getDate(rawInput.revisionModifiedOn, currentDateTime),
            revisionSavedOn: getDate(rawInput.revisionSavedOn, currentDateTime),
            revisionDeletedOn: getDate(rawInput.revisionDeletedOn, null),
            revisionRestoredOn: getDate(rawInput.revisionRestoredOn, null),
            revisionFirstPublishedOn: getDate(
                rawInput.revisionFirstPublishedOn,
                originalEntry.revisionFirstPublishedOn
            ),
            revisionLastPublishedOn: getDate(
                rawInput.revisionLastPublishedOn,
                originalEntry.revisionLastPublishedOn
            ),
            revisionCreatedBy: getIdentity(
                rawInput.revisionCreatedBy,
                originalEntry.revisionCreatedBy
            )!,
            revisionModifiedBy: getIdentity(rawInput.revisionModifiedBy, currentIdentity),
            revisionSavedBy: getIdentity(rawInput.revisionSavedBy, currentIdentity)!,
            revisionDeletedBy: getIdentity(rawInput.revisionSavedBy, null),
            revisionRestoredBy: getIdentity(rawInput.revisionRestoredBy, null),
            revisionFirstPublishedBy: getIdentity(
                rawInput.revisionFirstPublishedBy,
                originalEntry.revisionFirstPublishedBy
            ),
            revisionLastPublishedBy: getIdentity(
                rawInput.revisionLastPublishedBy,
                originalEntry.revisionLastPublishedBy
            ),
            createdOn: getDate(rawInput.createdOn, originalEntry.createdOn),
            savedOn: getDate(rawInput.savedOn, currentDateTime),
            modifiedOn: getDate(rawInput.modifiedOn, currentDateTime),
            deletedOn: getDate(rawInput.deletedOn, null),
            restoredOn: getDate(rawInput.restoredOn, null),
            firstPublishedOn: getDate(rawInput.firstPublishedOn, originalEntry.firstPublishedOn),
            lastPublishedOn: getDate(rawInput.lastPublishedOn, originalEntry.lastPublishedOn),
            createdBy: getIdentity(rawInput.createdBy, originalEntry.createdBy)!,
            savedBy: getIdentity(rawInput.savedBy, currentIdentity)!,
            modifiedBy: getIdentity(rawInput.modifiedBy, currentIdentity),
            deletedBy: getIdentity(rawInput.deletedBy, null),
            restoredBy: getIdentity(rawInput.restoredBy, null),
            firstPublishedBy: getIdentity(
                rawInput.firstPublishedBy,
                originalEntry.firstPublishedBy
            ),
            lastPublishedBy: getIdentity(rawInput.lastPublishedBy, originalEntry.lastPublishedBy),
            values,
            meta,
            status: transformEntryStatus(originalEntry.status),
            system: getSystem({
                input: rawInput,
                original: originalEntry
            }),
            live: originalEntry.live
        };

        const folderId = rawInput.wbyAco_location?.folderId;
        if (folderId) {
            entry.location = {
                folderId
            };
        }

        return {
            entry,
            input: {
                ...rawInput,
                values: structuredClone(values)
            }
        };
    }
}

export const UpdateEntryDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: UpdateEntryDataFactoryImpl,
    dependencies: [CmsContext, IdentityContext, TenantContext]
});
```

---

## Task 4: Inline `CreateEntryRevisionFromDataFactory`

**Files:**
- Modify: `packages/api-headless-cms/src/features/contentEntry/entryDataFactories/CreateEntryRevisionFromDataFactory/CreateEntryRevisionFromDataFactory.ts`

- [ ] **Step 1: Replace the file with the inlined version**

```typescript
// packages/api-headless-cms/src/features/contentEntry/entryDataFactories/CreateEntryRevisionFromDataFactory/CreateEntryRevisionFromDataFactory.ts
import { createImplementation } from "@webiny/feature/api";
import {
    CreateEntryRevisionFromDataFactory as FactoryAbstraction,
    type ICreateEntryRevisionFromDataFactory,
    type ICreateEntryRevisionFromDataResponse
} from "./abstractions.js";
import { AccessControl, CmsContext } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "~/types/index.js";
import { getDate } from "~/utils/date.js";
import { getIdentity } from "~/utils/identity.js";
import { mapAndCleanUpdatedInputData } from "../mapAndCleanUpdatedInputData.js";
import { validateModelEntryDataOrThrow } from "~/crud/contentEntry/entryDataValidation.js";
import { referenceFieldsMapping } from "~/crud/contentEntry/referenceFieldsMapping.js";
import { createIdentifier, parseIdentifier } from "@webiny/utils";
import WebinyError from "@webiny/error";
import { STATUS_DRAFT, STATUS_PUBLISHED, STATUS_UNPUBLISHED } from "../statuses.js";
import { NotAuthorizedError } from "~/utils/errors.js";
import { getSystem } from "../system.js";

const increaseEntryIdVersion = (id: string) => {
    const { id: entryId, version } = parseIdentifier(id);
    if (!version) {
        throw new WebinyError(
            "Cannot increase version on the ID without the version part.",
            "WRONG_ID",
            {
                id
            }
        );
    }
    return {
        entryId,
        version: version + 1,
        id: createIdentifier({
            id: entryId,
            version: version + 1
        })
    };
};

class CreateEntryRevisionFromDataFactoryImpl implements ICreateEntryRevisionFromDataFactory {
    public constructor(
        private readonly cmsContext: CmsContext.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly tenantContext: TenantContext.Interface,
        private readonly accessControl: AccessControl.Interface
    ) {}

    public async create<TValues extends CmsEntryValues = CmsEntryValues>(
        sourceId: string,
        model: CmsModel,
        rawInput: CreateCmsEntryInput<TValues>,
        originalEntry: CmsEntry<TValues>,
        latestStorageEntry: CmsEntry<TValues>,
        options?: CreateCmsEntryOptionsInput
    ): Promise<ICreateEntryRevisionFromDataResponse<TValues>> {
        const initialValues = {
            ...originalEntry.values,
            ...mapAndCleanUpdatedInputData<TValues>(model, rawInput.values)
        };

        await validateModelEntryDataOrThrow({
            context: this.cmsContext,
            model,
            values: initialValues,
            entry: originalEntry,
            skipValidators: options?.skipValidators
        });

        const values = await referenceFieldsMapping<TValues>({
            context: this.cmsContext,
            model,
            values: initialValues,
            validateEntries: false
        });

        const latestId = latestStorageEntry ? latestStorageEntry.id : sourceId;
        const { id, version: nextVersion } = increaseEntryIdVersion(latestId);

        const currentIdentity = this.identityContext.getIdentity();
        const currentDateTime = new Date();

        const status = rawInput.status || STATUS_DRAFT;
        if (status !== STATUS_DRAFT) {
            if (status === STATUS_PUBLISHED) {
                const canPublish = await this.accessControl.canAccessEntry({ model, pw: "p" });
                if (!canPublish) {
                    throw new NotAuthorizedError(
                        `Not allowed to access "${model.modelId}" entries.`
                    );
                }
            } else if (status === STATUS_UNPUBLISHED) {
                const canUnpublish = await this.accessControl.canAccessEntry({ model, pw: "u" });
                if (!canUnpublish) {
                    throw new NotAuthorizedError(
                        `Not allowed to access "${model.modelId}" entries.`
                    );
                }
            }
        }

        const locked = status !== STATUS_DRAFT;

        let revisionLevelPublishingMetaFields: Pick<
            CmsEntry,
            | "revisionFirstPublishedOn"
            | "revisionLastPublishedOn"
            | "revisionFirstPublishedBy"
            | "revisionLastPublishedBy"
        > = {
            revisionFirstPublishedOn: getDate(rawInput.revisionFirstPublishedOn, null),
            revisionLastPublishedOn: getDate(rawInput.revisionLastPublishedOn, null),
            revisionFirstPublishedBy: getIdentity(rawInput.revisionFirstPublishedBy, null),
            revisionLastPublishedBy: getIdentity(rawInput.revisionLastPublishedBy, null)
        };

        let entryLevelPublishingMetaFields: Pick<
            CmsEntry,
            "firstPublishedOn" | "lastPublishedOn" | "firstPublishedBy" | "lastPublishedBy"
        > = {
            firstPublishedOn: getDate(
                rawInput.firstPublishedOn,
                latestStorageEntry.firstPublishedOn
            ),
            lastPublishedOn: getDate(rawInput.lastPublishedOn, latestStorageEntry.lastPublishedOn),
            firstPublishedBy: getIdentity(
                rawInput.firstPublishedBy,
                latestStorageEntry.firstPublishedBy
            ),
            lastPublishedBy: getIdentity(
                rawInput.lastPublishedBy,
                latestStorageEntry.lastPublishedBy
            )
        };

        if (status === STATUS_PUBLISHED) {
            revisionLevelPublishingMetaFields = {
                revisionFirstPublishedOn: getDate(
                    rawInput.revisionFirstPublishedOn,
                    currentDateTime
                ),
                revisionLastPublishedOn: getDate(rawInput.revisionLastPublishedOn, currentDateTime),
                revisionFirstPublishedBy: getIdentity(
                    rawInput.revisionFirstPublishedBy,
                    currentIdentity
                ),
                revisionLastPublishedBy: getIdentity(
                    rawInput.revisionLastPublishedBy,
                    currentIdentity
                )
            };

            entryLevelPublishingMetaFields = {
                firstPublishedOn: getDate(
                    rawInput.firstPublishedOn,
                    latestStorageEntry.firstPublishedOn
                ),
                lastPublishedOn: getDate(rawInput.lastPublishedOn, currentDateTime),
                firstPublishedBy: getIdentity(
                    rawInput.firstPublishedBy,
                    latestStorageEntry.firstPublishedBy
                ),
                lastPublishedBy: getIdentity(rawInput.lastPublishedBy, currentIdentity)
            };
        }

        const entry: CmsEntry<TValues> = {
            ...originalEntry,
            id,
            version: nextVersion,
            createdOn: getDate(rawInput.createdOn, latestStorageEntry.createdOn),
            savedOn: getDate(rawInput.savedOn, currentDateTime),
            modifiedOn: getDate(rawInput.modifiedOn, currentDateTime),
            createdBy: getIdentity(rawInput.createdBy, latestStorageEntry.createdBy)!,
            savedBy: getIdentity(rawInput.savedBy, currentIdentity)!,
            modifiedBy: getIdentity(rawInput.modifiedBy, currentIdentity),
            ...entryLevelPublishingMetaFields,
            revisionCreatedOn: getDate(rawInput.revisionCreatedOn, currentDateTime),
            revisionSavedOn: getDate(rawInput.revisionSavedOn, currentDateTime),
            revisionModifiedOn: getDate(rawInput.revisionModifiedOn, null),
            revisionCreatedBy: getIdentity(rawInput.revisionCreatedBy, currentIdentity)!,
            revisionSavedBy: getIdentity(rawInput.revisionSavedBy, currentIdentity)!,
            revisionModifiedBy: getIdentity(rawInput.revisionModifiedBy, null),
            ...revisionLevelPublishingMetaFields,
            locked,
            status,
            values,
            system: getSystem({
                input: rawInput,
                original: originalEntry
            }),
            live: originalEntry.live
        };

        return {
            entry,
            input: {
                ...rawInput,
                values: structuredClone(values)
            }
        };
    }
}

export const CreateEntryRevisionFromDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: CreateEntryRevisionFromDataFactoryImpl,
    dependencies: [CmsContext, IdentityContext, TenantContext, AccessControl]
});
```

---

## Task 5: Inline `CreatePublishEntryDataFactory`

**Files:**
- Modify: `packages/api-headless-cms/src/features/contentEntry/entryDataFactories/CreatePublishEntryDataFactory/CreatePublishEntryDataFactory.ts`

- [ ] **Step 1: Replace the file with the inlined version**

```typescript
// packages/api-headless-cms/src/features/contentEntry/entryDataFactories/CreatePublishEntryDataFactory/CreatePublishEntryDataFactory.ts
import { createImplementation } from "@webiny/feature/api";
import {
    CreatePublishEntryDataFactory as FactoryAbstraction,
    type ICreatePublishEntryDataFactory,
    type ICreatePublishEntryDataResponse
} from "./abstractions.js";
import { CmsContext } from "~/features/shared/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { STATUS_PUBLISHED } from "../statuses.js";
import { validateModelEntryDataOrThrow } from "~/crud/contentEntry/entryDataValidation.js";
import { getIdentity } from "~/utils/identity.js";
import { getDate } from "~/utils/date.js";

class CreatePublishEntryDataFactoryImpl implements ICreatePublishEntryDataFactory {
    public constructor(
        private readonly cmsContext: CmsContext.Interface,
        private readonly identityContext: IdentityContext.Interface
    ) {}

    public async create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        originalEntry: CmsEntry<TValues>,
        latestEntry: CmsEntry<TValues>
    ): Promise<ICreatePublishEntryDataResponse<TValues>> {
        await validateModelEntryDataOrThrow({
            context: this.cmsContext,
            model,
            values: originalEntry.values,
            entry: originalEntry
        });

        const currentDateTime = new Date().toISOString();
        const currentIdentity = this.identityContext.getIdentity();

        const entry: CmsEntry<TValues> = {
            ...originalEntry,
            status: STATUS_PUBLISHED,
            locked: true,
            createdOn: getDate(latestEntry.createdOn),
            modifiedOn: getDate(currentDateTime),
            savedOn: getDate(currentDateTime),
            firstPublishedOn: getDate(latestEntry.firstPublishedOn, currentDateTime),
            lastPublishedOn: getDate(currentDateTime),
            createdBy: getIdentity(latestEntry.createdBy),
            modifiedBy: getIdentity(currentIdentity),
            savedBy: getIdentity(currentIdentity),
            firstPublishedBy: getIdentity(latestEntry.firstPublishedBy, currentIdentity),
            lastPublishedBy: getIdentity(currentIdentity),
            revisionCreatedOn: getDate(originalEntry.revisionCreatedOn),
            revisionSavedOn: getDate(currentDateTime),
            revisionModifiedOn: getDate(currentDateTime),
            revisionFirstPublishedOn: getDate(
                originalEntry.revisionFirstPublishedOn,
                currentDateTime
            ),
            revisionLastPublishedOn: getDate(currentDateTime),
            revisionCreatedBy: getIdentity(originalEntry.revisionCreatedBy),
            revisionSavedBy: getIdentity(currentIdentity),
            revisionModifiedBy: getIdentity(currentIdentity),
            revisionFirstPublishedBy: getIdentity(
                originalEntry.revisionFirstPublishedBy,
                currentIdentity
            ),
            revisionLastPublishedBy: getIdentity(currentIdentity),
            live: {
                version: originalEntry.version
            }
        };

        return { entry };
    }
}

export const CreatePublishEntryDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: CreatePublishEntryDataFactoryImpl,
    dependencies: [CmsContext, IdentityContext]
});
```

---

## Task 6: Inline `CreateUnpublishEntryDataFactory`

**Files:**
- Modify: `packages/api-headless-cms/src/features/contentEntry/entryDataFactories/CreateUnpublishEntryDataFactory/CreateUnpublishEntryDataFactory.ts`

- [ ] **Step 1: Replace the file with the inlined version**

```typescript
// packages/api-headless-cms/src/features/contentEntry/entryDataFactories/CreateUnpublishEntryDataFactory/CreateUnpublishEntryDataFactory.ts
import { createImplementation } from "@webiny/feature/api";
import {
    CreateUnpublishEntryDataFactory as FactoryAbstraction,
    type ICreateUnpublishEntryDataFactory,
    type ICreateUnpublishEntryDataResponse
} from "./abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { CmsEntry, CmsEntryValues } from "~/types/index.js";
import { STATUS_UNPUBLISHED } from "../statuses.js";
import { getIdentity } from "~/utils/identity.js";
import { getDate } from "~/utils/date.js";

class CreateUnpublishEntryDataFactoryImpl implements ICreateUnpublishEntryDataFactory {
    public constructor(private readonly identityContext: IdentityContext.Interface) {}

    public async create<TValues extends CmsEntryValues = CmsEntryValues>(
        originalEntry: CmsEntry<TValues>
    ): Promise<ICreateUnpublishEntryDataResponse<TValues>> {
        const currentDateTime = new Date().toISOString();
        const currentIdentity = this.identityContext.getIdentity();

        const entry: CmsEntry<TValues> = {
            ...originalEntry,
            status: STATUS_UNPUBLISHED,
            savedOn: getDate(currentDateTime),
            modifiedOn: getDate(currentDateTime),
            savedBy: getIdentity(currentIdentity),
            modifiedBy: getIdentity(currentIdentity),
            revisionSavedOn: getDate(currentDateTime),
            revisionModifiedOn: getDate(currentDateTime),
            revisionSavedBy: getIdentity(currentIdentity),
            revisionModifiedBy: getIdentity(currentIdentity),
            live: null
        };

        return { entry };
    }
}

export const CreateUnpublishEntryDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: CreateUnpublishEntryDataFactoryImpl,
    dependencies: [IdentityContext]
});
```

---

## Task 7: Inline `CreateRepublishEntryDataFactory`

**Files:**
- Modify: `packages/api-headless-cms/src/features/contentEntry/entryDataFactories/CreateRepublishEntryDataFactory/CreateRepublishEntryDataFactory.ts`

- [ ] **Step 1: Replace the file with the inlined version**

```typescript
// packages/api-headless-cms/src/features/contentEntry/entryDataFactories/CreateRepublishEntryDataFactory/CreateRepublishEntryDataFactory.ts
import { createImplementation } from "@webiny/feature/api";
import {
    CreateRepublishEntryDataFactory as FactoryAbstraction,
    type ICreateRepublishEntryDataFactory,
    type ICreateRepublishEntryDataResponse
} from "./abstractions.js";
import { CmsContext } from "~/features/shared/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import { referenceFieldsMapping } from "~/crud/contentEntry/referenceFieldsMapping.js";
import { STATUS_PUBLISHED } from "../statuses.js";
import { getIdentity } from "~/utils/identity.js";
import { getDate } from "~/utils/date.js";

class CreateRepublishEntryDataFactoryImpl implements ICreateRepublishEntryDataFactory {
    public constructor(
        private readonly cmsContext: CmsContext.Interface,
        private readonly identityContext: IdentityContext.Interface
    ) {}

    public async create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        originalEntry: CmsEntry<TValues>
    ): Promise<ICreateRepublishEntryDataResponse<TValues>> {
        const values = await referenceFieldsMapping<TValues>({
            context: this.cmsContext,
            model,
            values: originalEntry.values,
            validateEntries: false
        });

        const currentDateTime = new Date().toISOString();
        const currentIdentity = this.identityContext.getIdentity();

        const entry: CmsEntry<TValues> = {
            ...originalEntry,
            status: STATUS_PUBLISHED,
            savedOn: getDate(currentDateTime),
            modifiedOn: getDate(currentDateTime),
            savedBy: getIdentity(currentIdentity)!,
            modifiedBy: getIdentity(currentIdentity),
            firstPublishedOn: getDate(originalEntry.firstPublishedOn, currentDateTime),
            firstPublishedBy: getIdentity(originalEntry.firstPublishedBy, currentIdentity),
            lastPublishedOn: getDate(currentDateTime),
            lastPublishedBy: getIdentity(currentIdentity),
            revisionSavedOn: getDate(currentDateTime),
            revisionModifiedOn: getDate(currentDateTime),
            revisionSavedBy: getIdentity(currentIdentity)!,
            revisionModifiedBy: getIdentity(currentIdentity),
            revisionFirstPublishedOn: getDate(
                originalEntry.revisionFirstPublishedOn,
                currentDateTime
            ),
            revisionFirstPublishedBy: getIdentity(
                originalEntry.revisionFirstPublishedBy,
                currentIdentity
            ),
            revisionLastPublishedOn: getDate(currentDateTime),
            revisionLastPublishedBy: getIdentity(currentIdentity),
            values,
            live: {
                version: originalEntry.version
            }
        };

        return { entry };
    }
}

export const CreateRepublishEntryDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: CreateRepublishEntryDataFactoryImpl,
    dependencies: [CmsContext, IdentityContext]
});
```

---

## Task 8: Wire `CreateEntryUseCase` to inject factory

Remove the direct function call and the context dependencies that were only needed to feed it. Inject `CreateEntryDataFactory` instead.

**Files:**
- Modify: `packages/api-headless-cms/src/features/contentEntry/CreateEntry/CreateEntryUseCase.ts`

- [ ] **Step 1: Replace the file**

```typescript
// packages/api-headless-cms/src/features/contentEntry/CreateEntry/CreateEntryUseCase.ts
import { createImplementation, Result } from "@webiny/feature/api";
import { CreateEntryRepository, CreateEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { EntryAfterCreateEvent, EntryBeforeCreateEvent } from "./events.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "~/types/index.js";
import { EntryNotAuthorizedError, EntryValidationError } from "~/domain/contentEntry/errors.js";
import { CreateEntryDataFactory } from "~/features/contentEntry/entryDataFactories/CreateEntryDataFactory/index.js";

class CreateEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private eventPublisher: EventPublisher.Interface,
        private repository: CreateEntryRepository.Interface,
        private accessControl: AccessControl.Interface,
        private createEntryDataFactory: CreateEntryDataFactory.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        rawInput: CreateCmsEntryInput<T>,
        options?: CreateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "w" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        try {
            const { entry, input } = await this.createEntryDataFactory.create<T>(
                model,
                rawInput,
                options
            );

            const canAccessEntry = await this.accessControl.canAccessEntry({
                model,
                entry,
                rwd: "w"
            });

            if (!canAccessEntry) {
                return Result.fail(EntryNotAuthorizedError.fromEntry(entry));
            }

            await this.eventPublisher.publish(new EntryBeforeCreateEvent({ entry, input, model }));

            const result = await this.repository.execute(model, entry);
            if (result.isFail()) {
                return Result.fail(result.error);
            }

            await this.eventPublisher.publish(
                new EntryAfterCreateEvent({
                    entry,
                    input,
                    model
                })
            );

            return Result.ok(entry);
        } catch (error) {
            if (error.code === "VALIDATION_FAILED") {
                return Result.fail(new EntryValidationError(error.message, error.data));
            }
            return Result.fail(error as UseCaseAbstraction.Error);
        }
    }
}

export const CreateEntryUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: CreateEntryUseCaseImpl,
    dependencies: [EventPublisher, CreateEntryRepository, AccessControl, CreateEntryDataFactory]
});
```

---

## Task 9: Wire `UpdateEntryUseCase` to inject factory

**Files:**
- Modify: `packages/api-headless-cms/src/features/contentEntry/UpdateEntry/UpdateEntryUseCase.ts`

- [ ] **Step 1: Replace the file**

```typescript
// packages/api-headless-cms/src/features/contentEntry/UpdateEntry/UpdateEntryUseCase.ts
import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { UpdateEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateEntryRepository } from "./abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { EntryBeforeUpdateEvent, EntryAfterUpdateEvent } from "./events.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/abstractions.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "~/types/index.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { EntryLockedError } from "~/domain/contentEntry/errors.js";
import { UpdateEntryDataFactory } from "~/features/contentEntry/entryDataFactories/UpdateEntryDataFactory/index.js";

class UpdateEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private eventPublisher: EventPublisher.Interface,
        private repository: UpdateEntryRepository.Interface,
        private accessControl: AccessControl.Interface,
        private getRevisionByIdUseCase: GetRevisionByIdUseCase.Interface,
        private updateEntryDataFactory: UpdateEntryDataFactory.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        rawInput: UpdateCmsEntryInput<T>,
        metaInput?: GenericRecord,
        options?: UpdateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "w" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        try {
            const result = await this.getRevisionByIdUseCase.execute<T>(model, id);

            if (result.isFail()) {
                return Result.fail(result.error);
            }

            const originalEntry = result.value;

            if (originalEntry.locked) {
                return Result.fail(new EntryLockedError());
            }

            const { entry, input } = await this.updateEntryDataFactory.create<T>(
                model,
                rawInput,
                originalEntry,
                options,
                metaInput
            );

            const canAccessEntry = await this.accessControl.canAccessEntry({
                model,
                entry,
                rwd: "w"
            });

            if (!canAccessEntry) {
                return Result.fail(EntryNotAuthorizedError.fromModel(model));
            }

            await this.eventPublisher.publish(
                new EntryBeforeUpdateEvent({ entry, original: originalEntry, input, model })
            );

            const updateResult = await this.repository.execute(model, entry);
            if (updateResult.isFail()) {
                return Result.fail(updateResult.error);
            }

            await this.eventPublisher.publish(
                new EntryAfterUpdateEvent({
                    entry,
                    original: originalEntry,
                    input,
                    model
                })
            );

            return Result.ok(entry);
        } catch (error) {
            return Result.fail(error as UseCaseAbstraction.Error);
        }
    }
}

export const UpdateEntryUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: UpdateEntryUseCaseImpl,
    dependencies: [
        EventPublisher,
        UpdateEntryRepository,
        AccessControl,
        GetRevisionByIdUseCase,
        UpdateEntryDataFactory
    ]
});
```

---

## Task 10: Wire `CreateEntryRevisionFromUseCase` to inject factory

**Files:**
- Modify: `packages/api-headless-cms/src/features/contentEntry/CreateEntryRevisionFrom/CreateEntryRevisionFromUseCase.ts`

- [ ] **Step 1: Replace the file**

```typescript
// packages/api-headless-cms/src/features/contentEntry/CreateEntryRevisionFrom/CreateEntryRevisionFromUseCase.ts
import { createImplementation, Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    CreateEntryRevisionFromRepository,
    CreateEntryRevisionFromUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "~/types/index.js";
import {
    EntryRevisionAfterCreateEvent,
    EntryRevisionBeforeCreateEvent,
    EntryRevisionCreateErrorEvent
} from "./events.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { parseIdentifier } from "@webiny/utils";
import { CreateEntryRevisionFromDataFactory } from "~/features/contentEntry/entryDataFactories/CreateEntryRevisionFromDataFactory/index.js";

class CreateEntryRevisionFromUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private repository: CreateEntryRevisionFromRepository.Interface,
        private accessControl: AccessControl.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private getLatestRevision: GetLatestRevisionByEntryIdUseCase.Interface,
        private eventPublisher: EventPublisher.Interface,
        private createEntryRevisionFromDataFactory: CreateEntryRevisionFromDataFactory.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        sourceId: string,
        rawInput: CreateCmsEntryInput<T>,
        options?: CreateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "w" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        const { id: uniqueId } = parseIdentifier(sourceId);
        const originalResult = await this.getRevisionById.execute<T>(model, sourceId);

        if (originalResult.isFail()) {
            return Result.fail(originalResult.error);
        }

        const originalEntry = originalResult.value;

        const latestResult = await this.getLatestRevision.execute<T>(model, { id: uniqueId });

        if (latestResult.isFail()) {
            return Result.fail(latestResult.error);
        }

        const latestStorageEntry = latestResult.value;

        const { entry, input } = await this.createEntryRevisionFromDataFactory.create<T>(
            sourceId,
            model,
            rawInput,
            originalEntry,
            latestStorageEntry,
            options
        );

        const canAccessEntry = await this.accessControl.canAccessEntry({
            model,
            entry,
            rwd: "w"
        });

        if (!canAccessEntry) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        try {
            await this.eventPublisher.publish(
                new EntryRevisionBeforeCreateEvent({
                    entry,
                    model,
                    input,
                    original: originalEntry
                })
            );

            const result = await this.repository.execute<T>(model, entry);

            if (result.isFail()) {
                await this.eventPublisher.publish(
                    new EntryRevisionCreateErrorEvent({
                        entry,
                        model,
                        input,
                        original: originalEntry,
                        error: result.error
                    })
                );
                return Result.fail(result.error);
            }

            const createdEntry = result.value;

            await this.eventPublisher.publish(
                new EntryRevisionAfterCreateEvent({
                    entry: createdEntry,
                    model,
                    input,
                    original: originalEntry
                })
            );

            return Result.ok(createdEntry);
        } catch (error) {
            await this.eventPublisher.publish(
                new EntryRevisionCreateErrorEvent({
                    entry,
                    model,
                    input,
                    original: originalEntry,
                    error: error as Error
                })
            );
            return Result.fail(error as any);
        }
    }
}

export const CreateEntryRevisionFromUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: CreateEntryRevisionFromUseCaseImpl,
    dependencies: [
        CreateEntryRevisionFromRepository,
        AccessControl,
        GetRevisionByIdUseCase,
        GetLatestRevisionByEntryIdUseCase,
        EventPublisher,
        CreateEntryRevisionFromDataFactory
    ]
});
```

---

## Task 11: Wire `PublishEntryUseCase` to inject factory

**Files:**
- Modify: `packages/api-headless-cms/src/features/contentEntry/PublishEntry/PublishEntryUseCase.ts`

- [ ] **Step 1: Replace the file**

```typescript
// packages/api-headless-cms/src/features/contentEntry/PublishEntry/PublishEntryUseCase.ts
import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { PublishEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { PublishEntryRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import {
    EntryBeforePublishEvent,
    EntryAfterPublishEvent,
    EntryPublishErrorEvent
} from "./events.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import { CreatePublishEntryDataFactory } from "~/features/contentEntry/entryDataFactories/CreatePublishEntryDataFactory/index.js";

class PublishEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private repository: PublishEntryRepository.Interface,
        private accessControl: AccessControl.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private getLatestRevision: GetLatestRevisionByEntryIdUseCase.Interface,
        private eventPublisher: EventPublisher.Interface,
        private createPublishEntryDataFactory: CreatePublishEntryDataFactory.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const canAccess = await this.accessControl.canAccessEntry({ model, pw: "p" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        const result = await this.getRevisionById.execute<T>(model, id);

        if (result.isFail()) {
            return Result.fail(new EntryNotFoundError(id));
        }

        const originalEntry = result.value;

        const canAccessEntry = await this.accessControl.canAccessEntry({
            model,
            entry: originalEntry,
            pw: "p"
        });

        if (!canAccessEntry) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        const latestResult = await this.getLatestRevision.execute<T>(model, {
            id: originalEntry.entryId
        });

        if (latestResult.isFail()) {
            return Result.fail(latestResult.error);
        }

        const latestEntry = latestResult.value;

        const { entry } = await this.createPublishEntryDataFactory.create<T>(
            model,
            originalEntry,
            latestEntry
        );

        try {
            await this.eventPublisher.publish(
                new EntryBeforePublishEvent({
                    entry,
                    original: originalEntry,
                    model
                })
            );

            const repositoryResult = await this.repository.execute(model, entry);

            if (repositoryResult.isFail()) {
                await this.eventPublisher.publish(
                    new EntryPublishErrorEvent({
                        entry,
                        original: originalEntry,
                        model,
                        error: repositoryResult.error
                    })
                );
                return Result.fail(repositoryResult.error);
            }

            const publishedEntry = repositoryResult.value;

            await this.eventPublisher.publish(
                new EntryAfterPublishEvent({
                    entry: publishedEntry,
                    original: originalEntry,
                    model
                })
            );

            return Result.ok(entry);
        } catch (error) {
            await this.eventPublisher.publish(
                new EntryPublishErrorEvent({
                    entry,
                    original: originalEntry,
                    model,
                    error: error as Error
                })
            );
            return Result.fail(error as any);
        }
    }
}

export const PublishEntryUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: PublishEntryUseCaseImpl,
    dependencies: [
        PublishEntryRepository,
        AccessControl,
        GetRevisionByIdUseCase,
        GetLatestRevisionByEntryIdUseCase,
        EventPublisher,
        CreatePublishEntryDataFactory
    ]
});
```

---

## Task 12: Wire `UnpublishEntryUseCase` to inject factory

**Files:**
- Modify: `packages/api-headless-cms/src/features/contentEntry/UnpublishEntry/UnpublishEntryUseCase.ts`

- [ ] **Step 1: Replace the file**

```typescript
// packages/api-headless-cms/src/features/contentEntry/UnpublishEntry/UnpublishEntryUseCase.ts
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { parseIdentifier } from "@webiny/utils";
import { UnpublishEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UnpublishEntryRepository } from "./abstractions.js";
import { EntryBeforeUnpublishEvent } from "./events.js";
import { EntryAfterUnpublishEvent } from "./events.js";
import { EntryUnpublishErrorEvent } from "./events.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { GetPublishedRevisionByEntryIdUseCase } from "~/features/contentEntry/GetPublishedRevisionByEntryId/index.js";
import type { CmsEntry, CmsEntryValues } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import { EntryValidationError } from "~/domain/contentEntry/errors.js";
import { CreateUnpublishEntryDataFactory } from "~/features/contentEntry/entryDataFactories/CreateUnpublishEntryDataFactory/index.js";

class UnpublishEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private eventPublisher: EventPublisher.Interface,
        private repository: UnpublishEntryRepository.Interface,
        private accessControl: AccessControl.Interface,
        private getPublishedRevisionByEntryId: GetPublishedRevisionByEntryIdUseCase.Interface,
        private createUnpublishEntryDataFactory: CreateUnpublishEntryDataFactory.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const canAccess = await this.accessControl.canAccessEntry({ model, pw: "u" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        const { id: entryId } = parseIdentifier(id);

        const publishedResult = await this.getPublishedRevisionByEntryId.execute<T>(
            model,
            entryId
        );

        if (publishedResult.isFail()) {
            return Result.fail(publishedResult.error);
        }

        const originalEntry = publishedResult.value;

        if (!originalEntry) {
            return Result.fail(new EntryNotFoundError(id));
        }

        if (originalEntry.id !== id) {
            return Result.fail(new EntryValidationError(`Entry is not published!`));
        }

        const canAccessEntry = await this.accessControl.canAccessEntry({
            model,
            entry: originalEntry,
            pw: "u"
        });

        if (!canAccessEntry) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        const { entry } = await this.createUnpublishEntryDataFactory.create<T>(originalEntry);

        try {
            await this.eventPublisher.publish(new EntryBeforeUnpublishEvent({ entry, model }));

            const unpublishResult = await this.repository.execute<T>(model, entry);
            if (unpublishResult.isFail()) {
                await this.eventPublisher.publish(
                    new EntryUnpublishErrorEvent({ entry, model, error: unpublishResult.error })
                );
                return Result.fail(unpublishResult.error);
            }

            const storageEntry = unpublishResult.value;

            await this.eventPublisher.publish(
                new EntryAfterUnpublishEvent({
                    entry,
                    storageEntry,
                    model
                })
            );

            return Result.ok(entry);
        } catch (error) {
            await this.eventPublisher.publish(
                new EntryUnpublishErrorEvent({ entry, model, error: error as Error })
            );
            return Result.fail(error as UseCaseAbstraction.Error);
        }
    }
}

export const UnpublishEntryUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: UnpublishEntryUseCaseImpl,
    dependencies: [
        EventPublisher,
        UnpublishEntryRepository,
        AccessControl,
        GetPublishedRevisionByEntryIdUseCase,
        CreateUnpublishEntryDataFactory
    ]
});
```

---

## Task 13: Wire `RepublishEntryUseCase` to inject factory

**Files:**
- Modify: `packages/api-headless-cms/src/features/contentEntry/RepublishEntry/RepublishEntryUseCase.ts`

- [ ] **Step 1: Replace the file**

```typescript
// packages/api-headless-cms/src/features/contentEntry/RepublishEntry/RepublishEntryUseCase.ts
import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { RepublishEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { RepublishEntryRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import {
    EntryBeforeRepublishEvent,
    EntryAfterRepublishEvent,
    EntryRepublishErrorEvent
} from "./events.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import { CreateRepublishEntryDataFactory } from "~/features/contentEntry/entryDataFactories/CreateRepublishEntryDataFactory/index.js";

class RepublishEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private repository: RepublishEntryRepository.Interface,
        private accessControl: AccessControl.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private eventPublisher: EventPublisher.Interface,
        private createRepublishEntryDataFactory: CreateRepublishEntryDataFactory.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "w", pw: "p" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        const result = await this.getRevisionById.execute<T>(model, id);

        if (result.isFail()) {
            return Result.fail(new EntryNotFoundError(id));
        }

        const originalEntry = result.value;

        const canAccessEntry = await this.accessControl.canAccessEntry({
            model,
            entry: originalEntry,
            rwd: "w",
            pw: "p"
        });

        if (!canAccessEntry) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        const { entry } = await this.createRepublishEntryDataFactory.create<T>(
            model,
            originalEntry
        );

        try {
            await this.eventPublisher.publish(
                new EntryBeforeRepublishEvent({
                    entry,
                    model
                })
            );

            const repositoryResult = await this.repository.execute<T>(model, entry);

            if (repositoryResult.isFail()) {
                await this.eventPublisher.publish(
                    new EntryRepublishErrorEvent({
                        entry,
                        model,
                        error: repositoryResult.error
                    })
                );
                return Result.fail(repositoryResult.error);
            }

            const publishedEntry = repositoryResult.value;

            await this.eventPublisher.publish(
                new EntryAfterRepublishEvent({
                    entry: publishedEntry,
                    model
                })
            );

            return Result.ok(entry);
        } catch (error) {
            await this.eventPublisher.publish(
                new EntryRepublishErrorEvent({
                    entry,
                    model,
                    error: error as Error
                })
            );
            return Result.fail(error as any);
        }
    }
}

export const RepublishEntryUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: RepublishEntryUseCaseImpl,
    dependencies: [
        RepublishEntryRepository,
        AccessControl,
        GetRevisionByIdUseCase,
        EventPublisher,
        CreateRepublishEntryDataFactory
    ]
});
```

---

## Task 14: Update `ValidateEntryUseCase` import

Only the import path changes — no logic changes.

**Files:**
- Modify: `packages/api-headless-cms/src/features/contentEntry/ValidateEntry/ValidateEntryUseCase.ts`

- [ ] **Step 1: Replace the old import line**

Find:
```typescript
import { mapAndCleanUpdatedInputData } from "~/crud/contentEntry/entryDataFactories/index.js";
```

Replace with:
```typescript
import { mapAndCleanUpdatedInputData } from "~/features/contentEntry/entryDataFactories/mapAndCleanUpdatedInputData.js";
```

---

## Task 15: Delete the old `crud/contentEntry/entryDataFactories/` directory

All consumers have been migrated. The old directory is now dead code.

**Files:**
- Delete: `packages/api-headless-cms/src/crud/contentEntry/entryDataFactories/` (entire directory)

- [ ] **Step 1: Delete the directory**

```bash
rm -rf packages/api-headless-cms/src/crud/contentEntry/entryDataFactories
```

---

## Task 16: Type check, pre-commit checks, and commit

- [ ] **Step 1: Type check the package**

```bash
yarn check -p @webiny/api-headless-cms 2>&1 | tail -30
```

Expected: no errors. If errors appear, fix them before proceeding.

- [ ] **Step 2: Run pre-commit checks**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
```

If any step modifies files, re-run the sequence from `git add .`.

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
refactor(api-headless-cms): inline entry data factory logic, wire use cases to inject factories

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```
