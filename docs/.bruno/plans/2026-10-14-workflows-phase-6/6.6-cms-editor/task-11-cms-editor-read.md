### Task 11: CMS editor `read`

Spec 9.3; D55, D62; R87, R172, R173; SEC-66; Review Focus 3. The `cms.*` adapter of the `ReviewTargetEditor` port (Task 9) in `packages/api-headless-cms-workflows`. This task builds `canEdit`, `read` and the pure `toEditorFields`; `update` is a stub that fails with `This target cannot be edited.` until Task 12.

- `features/target/CmsEntryReviewTargetEditor.ts` (flat file in `features/target/`, like `CmsEntryReviewTargetLoader.ts`; no barrel). `canEdit(model)` is `isCmsNamespace(model)`. `read({ model, targetId, targetRevisionId })` loads model, group and revision through `CmsEntryTargetReader` (the same reader the loader uses: the model and group are read through the access-controlled use cases **as the request identity**, SEC-66, the revision itself is read without entry checks) and returns `Result.ok({ title, fields })`. SEC-66 tests use real user contexts; in production the AI run is attributed to the requester with authorization off (R161), so the model and group checks in `CmsEntryTargetReader` are no-ops there; the target id comes from the stored review snapshot, never from the model.
- `title` is `getEntryTitle(model, entry)` (the model's title field, the entry id when it has none, as `toCmsReviewTarget` does).
- `fields` is `toEditorFields(model, entry.values)`, in model order:
  - Every field is read, whatever its type, with `path`, `label`, `type` (the CMS field type), `value` (`null` when the entry has none) and `writable`.
  - A non-list `object` field is not a row itself: its children flatten into dotted paths (`address.street`, `address.location.label`), recursively. A child of an object whose value is `null` reads as `null`.
  - A `multipleValues` field (`field.list`) is one row with the whole list as `value` and `writable: false`, including a list of objects (its children are not flattened).
  - `writable` is true only when the field is of type `text`, `long-text`, `number`, `boolean` or `datetime` and is not a list. Because list objects are never descended into, nothing inside a `multipleValues` object is ever writable. References (`ref`), files, rich text, dynamic zones and every other type are read-only (R172).
- Failures (R87, never a rejected promise): a revision that is missing, belongs to another entry (`entry.entryId !== targetId`), whose model is not readable by the current identity, or a namespace that is not `cms.*` fails with `ReviewTargetEditorError("The target was not found.")`; a throwing reader is logged with `Logger.error({ error, model, targetId }, "Could not read the target for the AI editor.")` and fails with `ReviewTargetEditorError("The target could not be read.")`.
- Registered in `target/feature.ts` next to the other CMS ports, so it sits under the same gate as `CmsEntryReviewTargetLoader` (`CmsWorkflowsFeature` registers `CmsTargetFeature`; the editor adds no flag of its own, the AI step type is what is gated, R177).

**Files:**
- Create: `packages/api-headless-cms-workflows/src/features/target/toEditorFields.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewTargetEditor.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/target/feature.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/registration.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__cms/profileModel.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/profileEntries.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/ThrowingCmsEntryTargetReader.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/target/toEditorFields.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/target/CmsEntryReviewTargetEditorRead.test.ts`

**Interfaces:**
- Consumes:
  - Task 9 (`@webiny/api-workflows`): `ReviewTargetEditor` (`features/review/ReviewTargetEditor/index.js`; `createImplementation`, `Interface`), the interfaces `ReviewTargetEditorField`, `ReviewTargetContent`, `ReviewTargetEditorReadParams`, `ReviewTargetEditorUpdateParams`, `ReviewTargetEditorUpdateResult` (`features/review/ReviewTargetEditor/abstractions.js`, named exactly as in the contract) and `ReviewTargetEditorError` (`domain/review/errors.js`, `new ReviewTargetEditorError(message: string)`, code `Workflows/ReviewTarget/EditorError`).
  - Existing: `CmsEntryTargetReader` (`./CmsEntryTargetReader/index.js`; `read({ model, targetRevisionId }): Promise<{ model, group, entry } | null>`, throws on unexpected failures), `isCmsNamespace` (`~/utils/appName.js`), `getEntryTitle(model, entry)` (`@webiny/api-headless-cms/utils/getEntryTitle.js`), `Logger` (`@webiny/api-core/features/logger/index.js`), `Result` (`@webiny/feature/api`), `CmsModel`, `CmsModelField`, `CmsEntryValues` (`@webiny/api-headless-cms/types/index.js`).
  - Test helpers: `createTestContext` (`~tests/__helpers/testContext.js`), `createUserContext` (`~tests/__helpers/userContext.js`), `captureLoggedErrors`, `loggedErrors` (`~tests/__helpers/CapturingLogger.js`), `expectOk` (`~tests/__helpers/entries.js`), `NOBODY`, `READER` (`~tests/__helpers/identities.js`), `CMS_READER` (`~tests/__helpers/permissions.js`), `createModelPlugin` (`@webiny/api-headless-cms`).
- Produces (matches the contract):
  - `CmsEntryReviewTargetEditor` (`~/features/target/CmsEntryReviewTargetEditor.js`): `ReviewTargetEditor` implementation, `canEdit(model)`, `read(params)`; `update` still a stub. Consumed by Tasks 12 and 20.
  - `toEditorFields(model: Pick<CmsModel, "fields">, values: CmsEntryValues): ReviewTargetEditorField[]` (`~/features/target/toEditorFields.js`), pure. Consumed by Task 12 (writability lookup).
  - Test fixtures for Tasks 12 and 20: `profileModel`, `PROFILE_NAMESPACE`, `createProfilePlugins()` (`~tests/__cms/profileModel.js`), `createProfileEntry(context, values?, options?: CreateEntryUseCase.Options)`, `readProfile`, `PROFILE_VALUES` (`~tests/__helpers/profileEntries.js`), `throwingCmsEntryTargetReader`, `malformedModelCmsEntryTargetReader` (`~tests/__helpers/ThrowingCmsEntryTargetReader.js`).

- [ ] **Step 1: Write the failing tests**

The integration tests use a code model "profile" with a field of every kind the rules distinguish: writable scalars (`text`, `long-text`, `number`, `boolean`, `datetime`), a nested object two levels deep, a list of texts, a list of objects, a reference and a required title with a number validator (used by Task 12).

Create `packages/api-headless-cms-workflows/__tests__/__cms/profileModel.ts`:

```ts
import { createModelPlugin } from "@webiny/api-headless-cms";

/** The review namespace of the profile model. */
export const PROFILE_NAMESPACE = "cms.profile";

/**
 * A code model for the CMS target editor tests: writable scalars, a nested object (two levels
 * deep, with a read-only reference `address.landlord` and a read-only multiple-values text
 * `address.labels` inside it, so a write next to them can prove they survive, Review Focus 3), a
 * multiple-values text, a multiple-values object and a reference (R172). `name` is
 * required and `age` must be at least 0, so the CMS validators have something to refuse.
 */
export const profileModel = {
    modelId: "profile",
    name: "Profile",
    group: "default",
    titleFieldId: "name",
    description: "",
    icon: null,
    singularApiName: "Profile",
    pluralApiName: "Profiles",
    layout: [
        ["name"],
        ["bio"],
        ["age"],
        ["active"],
        ["joinedOn"],
        ["address"],
        ["tags"],
        ["contacts"],
        ["employer"]
    ],
    fields: [
        {
            id: "name",
            storageId: "text@name",
            fieldId: "name",
            type: "text",
            label: "Name",
            validation: [{ name: "required", message: "Name is required." }],
            listValidation: []
        },
        {
            id: "bio",
            storageId: "long-text@bio",
            fieldId: "bio",
            type: "long-text",
            label: "Bio",
            validation: [],
            listValidation: []
        },
        {
            id: "age",
            storageId: "number@age",
            fieldId: "age",
            type: "number",
            label: "Age",
            validation: [
                { name: "gte", message: "Age must be 0 or more.", settings: { value: 0 } }
            ],
            listValidation: []
        },
        {
            id: "active",
            storageId: "boolean@active",
            fieldId: "active",
            type: "boolean",
            label: "Active",
            validation: [],
            listValidation: []
        },
        {
            id: "joinedOn",
            storageId: "datetime@joinedOn",
            fieldId: "joinedOn",
            type: "datetime",
            label: "Joined on",
            settings: { type: "dateTimeWithoutTimezone" },
            validation: [],
            listValidation: []
        },
        {
            id: "address",
            storageId: "object@address",
            fieldId: "address",
            type: "object",
            label: "Address",
            validation: [],
            listValidation: [],
            settings: {
                layout: [["street"], ["zip"], ["location"], ["landlord"], ["labels"]],
                fields: [
                    {
                        id: "street",
                        storageId: "text@street",
                        fieldId: "street",
                        type: "text",
                        label: "Street",
                        validation: [],
                        listValidation: []
                    },
                    {
                        id: "zip",
                        storageId: "number@zip",
                        fieldId: "zip",
                        type: "number",
                        label: "Zip",
                        validation: [],
                        listValidation: []
                    },
                    {
                        id: "location",
                        storageId: "object@location",
                        fieldId: "location",
                        type: "object",
                        label: "Location",
                        validation: [],
                        listValidation: [],
                        settings: {
                            layout: [["label"]],
                            fields: [
                                {
                                    id: "label",
                                    storageId: "text@label",
                                    fieldId: "label",
                                    type: "text",
                                    label: "Label",
                                    validation: [],
                                    listValidation: []
                                }
                            ]
                        }
                    },
                    {
                        id: "landlord",
                        storageId: "ref@landlord",
                        fieldId: "landlord",
                        type: "ref",
                        label: "Landlord",
                        validation: [],
                        listValidation: [],
                        settings: { models: [{ modelId: "author" }] }
                    },
                    {
                        id: "labels",
                        storageId: "text@labels",
                        fieldId: "labels",
                        type: "text",
                        label: "Labels",
                        list: true,
                        validation: [],
                        listValidation: []
                    }
                ]
            }
        },
        {
            id: "tags",
            storageId: "text@tags",
            fieldId: "tags",
            type: "text",
            label: "Tags",
            list: true,
            validation: [],
            listValidation: []
        },
        {
            id: "contacts",
            storageId: "object@contacts",
            fieldId: "contacts",
            type: "object",
            label: "Contacts",
            list: true,
            validation: [],
            listValidation: [],
            settings: {
                layout: [["email"]],
                fields: [
                    {
                        id: "email",
                        storageId: "text@email",
                        fieldId: "email",
                        type: "text",
                        label: "Email",
                        validation: [],
                        listValidation: []
                    }
                ]
            }
        },
        {
            id: "employer",
            storageId: "ref@employer",
            fieldId: "employer",
            type: "ref",
            label: "Employer",
            validation: [],
            listValidation: [],
            settings: { models: [{ modelId: "author" }] }
        }
    ]
};

export const createProfilePlugins = () => {
    return [createModelPlugin(profileModel as Parameters<typeof createModelPlugin>[0])];
};
```

Create `packages/api-headless-cms-workflows/__tests__/__helpers/profileEntries.ts`:

```ts
import type { CmsContext, CmsEntry, CmsEntryValues } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/index.js";
import { expectOk } from "./entries.js";

/** The values of the entry `createProfileEntry` creates by default. */
export const PROFILE_VALUES: CmsEntryValues = {
    name: "Ann",
    bio: "Writes books.",
    age: 30,
    active: true,
    joinedOn: "2024-01-15T10:00:00",
    address: {
        street: "Main Street",
        zip: 1000,
        location: { label: "Home" },
        landlord: { modelId: "author", entryId: "landlord", id: "landlord#0001" },
        labels: ["home", "main"]
    },
    tags: ["a", "b"],
    contacts: [{ email: "ann@example.com" }]
};

/**
 * Creates a "profile" entry as the context's identity. `options.skipValidation` creates a fixture
 * the model validators would refuse (for example an empty required `name`).
 */
export const createProfileEntry = async (
    context: CmsContext,
    values: CmsEntryValues = PROFILE_VALUES,
    options?: CreateEntryUseCase.Options
): Promise<CmsEntry> => {
    const model = expectOk(await context.container.resolve(GetModelUseCase).execute("profile"));
    return expectOk(
        await context.container
            .resolve(CreateEntryUseCase)
            .execute(model, { values, location: { folderId: "root" } }, options)
    );
};

/** Reads a "profile" revision straight from the CMS, for asserting what was written. */
export const readProfile = async (context: CmsContext, revisionId: string): Promise<CmsEntry> => {
    const model = expectOk(await context.container.resolve(GetModelUseCase).execute("profile"));
    return expectOk(await context.container.resolve(GetRevisionByIdUseCase).execute(model, revisionId));
};
```

Create `packages/api-headless-cms-workflows/__tests__/__helpers/ThrowingCmsEntryTargetReader.ts`:

```ts
import type { Container } from "@webiny/di";
import { CmsEntryTargetReader } from "~/features/target/CmsEntryTargetReader/index.js";

class ThrowingTargetReader implements CmsEntryTargetReader.Interface {
    public constructor(private decoratee: CmsEntryTargetReader.Interface) {}

    public async read(): Promise<CmsEntryTargetReader.Target | null> {
        throw new Error("Storage is down.");
    }
}

class MalformedModelTargetReader implements CmsEntryTargetReader.Interface {
    public constructor(private decoratee: CmsEntryTargetReader.Interface) {}

    public async read(
        params: CmsEntryTargetReader.Params
    ): Promise<CmsEntryTargetReader.Target | null> {
        const target = await this.decoratee.read(params);
        if (!target) {
            return null;
        }
        // A model whose `fields` is gone: `toEditorFields` throws on it.
        return { ...target, model: { ...target.model, fields: undefined as never } };
    }
}

/** Makes every target read return a model with no `fields` (`legacyPlugins`). */
export const malformedModelCmsEntryTargetReader = (container: Container) => {
    container.registerDecorator(
        CmsEntryTargetReader.createDecorator({
            decorator: MalformedModelTargetReader,
            dependencies: [CmsEntryTargetReader]
        })
    );
};

/** Makes every target read throw (`legacyPlugins`). Entry creation does not use the reader. */
export const throwingCmsEntryTargetReader = (container: Container) => {
    container.registerDecorator(
        CmsEntryTargetReader.createDecorator({ decorator: ThrowingTargetReader, dependencies: [] })
    );
};
```

Create `packages/api-headless-cms-workflows/__tests__/target/toEditorFields.test.ts` (pure, hand-built models so dynamic zones, files and rich text need no field plugin):

```ts
import { describe, expect, it } from "vitest";
import type { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import { toEditorFields } from "~/features/target/toEditorFields.js";

const field = (overrides: Partial<CmsModelField> & Pick<CmsModelField, "fieldId" | "type">) => {
    return {
        id: overrides.fieldId,
        storageId: `${overrides.type}@${overrides.fieldId}`,
        label: overrides.fieldId.toUpperCase(),
        validation: [],
        listValidation: [],
        ...overrides
    } as CmsModelField;
};

const createModel = (fields: CmsModelField[]): Pick<CmsModel, "fields"> => {
    return { fields };
};

describe("toEditorFields", () => {
    it("marks only top-level scalar fields of the five writable types as writable", () => {
        const model = createModel([
            field({ fieldId: "a", type: "text" }),
            field({ fieldId: "b", type: "long-text" }),
            field({ fieldId: "c", type: "number" }),
            field({ fieldId: "d", type: "boolean" }),
            field({ fieldId: "e", type: "datetime" })
        ]);

        const fields = toEditorFields(model, { a: "x", b: "y", c: 1, d: true, e: "2024-01-15" });

        expect(fields).toEqual([
            { path: "a", label: "A", type: "text", value: "x", writable: true },
            { path: "b", label: "B", type: "long-text", value: "y", writable: true },
            { path: "c", label: "C", type: "number", value: 1, writable: true },
            { path: "d", label: "D", type: "boolean", value: true, writable: true },
            { path: "e", label: "E", type: "datetime", value: "2024-01-15", writable: true }
        ]);
    });

    it("reads dynamic zones, references, files, rich text and other types as read-only", () => {
        const model = createModel([
            field({ fieldId: "zone", type: "dynamicZone" }),
            field({ fieldId: "ref", type: "ref" }),
            field({ fieldId: "file", type: "file" }),
            field({ fieldId: "body", type: "rich-text" }),
            field({ fieldId: "custom", type: "customPluginType" })
        ]);

        const fields = toEditorFields(model, {
            zone: { _templateId: "t1" },
            ref: { id: "r1", entryId: "r1", modelId: "author" },
            file: "https://files/a.png",
            body: [{ type: "p" }],
            custom: "x"
        });

        expect(fields.map(item => [item.path, item.type, item.writable])).toEqual([
            ["zone", "dynamicZone", false],
            ["ref", "ref", false],
            ["file", "file", false],
            ["body", "rich-text", false],
            ["custom", "customPluginType", false]
        ]);
        expect(fields[0].value).toEqual({ _templateId: "t1" });
    });

    it("gives a missing value as null", () => {
        const fields = toEditorFields(createModel([field({ fieldId: "a", type: "text" })]), {});

        expect(fields).toEqual([{ path: "a", label: "A", type: "text", value: null, writable: true }]);
    });

    it("flattens nested objects to dotted paths, recursively, with writable leaves", () => {
        const model = createModel([
            field({
                fieldId: "address",
                type: "object",
                settings: {
                    fields: [
                        field({ fieldId: "street", type: "text" }),
                        field({
                            fieldId: "location",
                            type: "object",
                            settings: {
                                fields: [
                                    field({ fieldId: "label", type: "text" }),
                                    field({ fieldId: "photo", type: "file" })
                                ]
                            }
                        })
                    ]
                }
            })
        ]);

        const fields = toEditorFields(model, {
            address: { street: "Main", location: { label: "Home", photo: "p.png" } }
        });

        expect(fields.map(item => [item.path, item.value, item.writable])).toEqual([
            ["address.street", "Main", true],
            ["address.location.label", "Home", true],
            ["address.location.photo", "p.png", false]
        ]);
    });

    it("reads the children of an object whose value is missing as null", () => {
        const model = createModel([
            field({
                fieldId: "address",
                type: "object",
                settings: { fields: [field({ fieldId: "street", type: "text" })] }
            })
        ]);

        expect(toEditorFields(model, { address: null })).toEqual([
            { path: "address.street", label: "STREET", type: "text", value: null, writable: true }
        ]);
        expect(toEditorFields(model, {})).toEqual([
            { path: "address.street", label: "STREET", type: "text", value: null, writable: true }
        ]);
    });

    it("reads a multiple-values field as one read-only row and never descends into a list object", () => {
        const model = createModel([
            field({ fieldId: "tags", type: "text", list: true }),
            field({
                fieldId: "contacts",
                type: "object",
                list: true,
                settings: { fields: [field({ fieldId: "email", type: "text" })] }
            })
        ]);

        const fields = toEditorFields(model, {
            tags: ["a"],
            contacts: [{ email: "a@b.c" }]
        });

        expect(fields).toEqual([
            { path: "tags", label: "TAGS", type: "text", value: ["a"], writable: false },
            {
                path: "contacts",
                label: "CONTACTS",
                type: "object",
                value: [{ email: "a@b.c" }],
                writable: false
            }
        ]);
    });

    it("reads an object without child definitions as one read-only row", () => {
        const model = createModel([field({ fieldId: "blob", type: "object" })]);

        expect(toEditorFields(model, { blob: { x: 1 } })).toEqual([
            { path: "blob", label: "BLOB", type: "object", value: { x: 1 }, writable: false }
        ]);
    });
});
```

Create `packages/api-headless-cms-workflows/__tests__/target/CmsEntryReviewTargetEditorRead.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { ReviewTargetEditor } from "@webiny/api-workflows/features/review/ReviewTargetEditor/index.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createTestContext } from "~tests/__helpers/testContext.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import {
    malformedModelCmsEntryTargetReader,
    throwingCmsEntryTargetReader
} from "~tests/__helpers/ThrowingCmsEntryTargetReader.js";
import { createProfileEntry, PROFILE_VALUES } from "~tests/__helpers/profileEntries.js";
import { createProfilePlugins, PROFILE_NAMESPACE } from "~tests/__cms/profileModel.js";
import { NOBODY, READER } from "~tests/__helpers/identities.js";
import { CMS_READER } from "~tests/__helpers/permissions.js";

const createProfileContext = (legacyPlugins: unknown[] = []) => {
    return createTestContext({
        withWorkflow: false,
        legacyPlugins: [...createProfilePlugins(), captureLoggedErrors, ...legacyPlugins]
    });
};

const getEditor = (context: CmsContext): ReviewTargetEditor.Interface => {
    return context.container
        .resolveAll(ReviewTargetEditor)
        .find(item => item.canEdit(PROFILE_NAMESPACE))!;
};

beforeEach(() => {
    loggedErrors.length = 0;
});

describe("CmsEntryReviewTargetEditor.read", () => {
    it("claims cms namespaces only", async () => {
        const context = await createProfileContext();
        const editors = context.container.resolveAll(ReviewTargetEditor);

        expect(editors.filter(item => item.canEdit("cms.profile"))).toHaveLength(1);
        expect(editors.filter(item => item.canEdit("cms.author"))).toHaveLength(1);
        expect(editors.some(item => item.canEdit("wb.page"))).toBe(false);
        expect(editors.some(item => item.canEdit("profile"))).toBe(false);
    });

    it("reads the title and every field, nested objects flattened, with writability (R172)", async () => {
        const context = await createProfileContext();
        const entry = await createProfileEntry(context);

        const result = await getEditor(context).read({
            model: PROFILE_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: entry.id
        });

        expect(result.isOk()).toBe(true);
        const content = result.value;
        expect(content.title).toBe("Ann");
        expect(content.fields.map(item => [item.path, item.type, item.writable])).toEqual([
            ["name", "text", true],
            ["bio", "long-text", true],
            ["age", "number", true],
            ["active", "boolean", true],
            ["joinedOn", "datetime", true],
            ["address.street", "text", true],
            ["address.zip", "number", true],
            ["address.location.label", "text", true],
            ["address.landlord", "ref", false],
            ["address.labels", "text", false],
            ["tags", "text", false],
            ["contacts", "object", false],
            ["employer", "ref", false]
        ]);
        const byPath = Object.fromEntries(content.fields.map(item => [item.path, item]));
        expect(byPath.name).toEqual({
            path: "name",
            label: "Name",
            type: "text",
            value: "Ann",
            writable: true
        });
        expect(byPath.age.value).toBe(30);
        expect(byPath.active.value).toBe(true);
        expect(byPath.joinedOn.value).toBe(entry.values.joinedOn);
        expect(byPath["address.street"].value).toBe("Main Street");
        expect(byPath["address.location.label"].value).toBe("Home");
        expect(byPath["address.landlord"].value).toEqual({
            modelId: "author",
            entryId: "landlord",
            id: "landlord#0001"
        });
        expect(byPath["address.labels"].value).toEqual(["home", "main"]);
        expect(byPath.tags.value).toEqual(["a", "b"]);
        expect(byPath.contacts.value).toEqual([{ email: "ann@example.com" }]);
        expect(byPath.employer.value).toBeNull();
    });

    it("reads the children of a missing object as null", async () => {
        const context = await createProfileContext();
        const entry = await createProfileEntry(context, { ...PROFILE_VALUES, address: null });

        const result = await getEditor(context).read({
            model: PROFILE_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: entry.id
        });

        const street = result.value.fields.find(item => item.path === "address.street");
        expect(street).toMatchObject({ value: null, writable: true });
    });

    it("falls back to the entry id when the title field is empty", async () => {
        const context = await createProfileContext();
        const entry = await createProfileEntry(
            context,
            { ...PROFILE_VALUES, name: "" },
            { skipValidation: true }
        );

        const result = await getEditor(context).read({
            model: PROFILE_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: entry.id
        });

        expect(result.value.title).toBe(entry.id);
    });

    it("fails for a missing revision and for a revision of another entry", async () => {
        const context = await createProfileContext();
        const entry = await createProfileEntry(context);
        const editor = getEditor(context);

        const missing = await editor.read({
            model: PROFILE_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: `${entry.entryId}#0009`
        });
        const mismatched = await editor.read({
            model: PROFILE_NAMESPACE,
            targetId: "another-entry",
            targetRevisionId: entry.id
        });

        expect(missing.isFail()).toBe(true);
        expect(missing.error.code).toBe("Workflows/ReviewTarget/EditorError");
        expect(missing.error.message).toBe("The target was not found.");
        expect(mismatched.isFail()).toBe(true);
        expect(mismatched.error.message).toBe("The target was not found.");
        expect(loggedErrors).toEqual([]);
    });

    it("fails for a model that does not exist", async () => {
        const context = await createProfileContext();
        const entry = await createProfileEntry(context);

        const result = await getEditor(context).read({
            model: "cms.doesNotExist",
            targetId: entry.entryId,
            targetRevisionId: entry.id
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("The target was not found.");
    });

    it("reads as the request identity: a user who cannot read the model gets nothing (SEC-66)", async () => {
        const admin = await createProfileContext();
        const entry = await createProfileEntry(admin);
        const reader = await createUserContext({
            identity: READER,
            permissions: CMS_READER,
            legacyPlugins: createProfilePlugins()
        });
        const nobody = await createUserContext({
            identity: NOBODY,
            permissions: [],
            legacyPlugins: createProfilePlugins()
        });
        const params = {
            model: PROFILE_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: entry.id
        };

        const asReader = await getEditor(reader).read(params);
        const asNobody = await getEditor(nobody).read(params);

        expect(asReader.isOk()).toBe(true);
        expect(asReader.value.title).toBe("Ann");
        expect(asNobody.isFail()).toBe(true);
        expect(asNobody.error.message).toBe("The target was not found.");
    });

    it("logs a throwing reader and fails with a generic text instead of rejecting (R87)", async () => {
        const context = await createProfileContext([throwingCmsEntryTargetReader]);
        const entry = await createProfileEntry(context);

        const result = await getEditor(context).read({
            model: PROFILE_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: entry.id
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("The target could not be read.");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not read the target for the AI editor.");
        expect(loggedErrors[0].fields).toMatchObject({
            model: PROFILE_NAMESPACE,
            targetId: entry.entryId
        });
    });

    it("fails with a generic text and one log for a malformed model instead of rejecting (R87)", async () => {
        const context = await createProfileContext([malformedModelCmsEntryTargetReader]);
        const entry = await createProfileEntry(context);

        const result = await getEditor(context).read({
            model: PROFILE_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: entry.id
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("The target could not be read.");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not read the target for the AI editor.");
    });

    it("refuses to update until Task 12", async () => {
        const context = await createProfileContext();
        const entry = await createProfileEntry(context);

        const result = await getEditor(context).update({
            model: PROFILE_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: entry.id,
            values: { name: "New" }
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("This target cannot be edited.");
    });
});
```

Modify `packages/api-headless-cms-workflows/__tests__/registration.test.ts`: import `ReviewTargetEditor` (`@webiny/api-workflows/features/review/ReviewTargetEditor/index.js`) next to the other port imports and add one line after `expect(container.resolveAll(ReviewTargetFolderChain)).toHaveLength(1);`:

```ts
        expect(container.resolveAll(ReviewTargetEditor)).toHaveLength(1);
```

and in the licence-off test (`registers no wrapper and no guard without the advancedPublishingWorkflow license`) add one line after `expect(container.resolveAll(ReviewTargetFolderChain)).toHaveLength(0);`:

```ts
        expect(container.resolveAll(ReviewTargetEditor)).toHaveLength(0);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/target/toEditorFields.test.ts packages/api-headless-cms-workflows/__tests__/target/CmsEntryReviewTargetEditorRead.test.ts packages/api-headless-cms-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL. `toEditorFields.js` does not exist (import error); the read tests find no editor (`getEditor` returns `undefined`); the registration test sees zero `ReviewTargetEditor` registrations.

Run the same with `yarn test:os` (one run at a time):
`yarn test:os packages/api-headless-cms-workflows/__tests__/target/toEditorFields.test.ts packages/api-headless-cms-workflows/__tests__/target/CmsEntryReviewTargetEditorRead.test.ts packages/api-headless-cms-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, same reason.

- [ ] **Step 3: Implement**

Create `packages/api-headless-cms-workflows/src/features/target/toEditorFields.ts`:

```ts
import type {
    CmsEntryValues,
    CmsModel,
    CmsModelField
} from "@webiny/api-headless-cms/types/index.js";
import type { ReviewTargetEditorField } from "@webiny/api-workflows/features/review/ReviewTargetEditor/abstractions.js";

/** The field types the AI may write (R172). Everything else is read-only. */
export const WRITABLE_FIELD_TYPES: string[] = ["text", "long-text", "number", "boolean", "datetime"];

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const flattenFields = (
    fields: CmsModelField[],
    values: Record<string, unknown>,
    parentPath: string[]
): ReviewTargetEditorField[] => {
    const rows: ReviewTargetEditorField[] = [];
    for (const field of fields) {
        const segments = [...parentPath, field.fieldId];
        const value = values[field.fieldId];
        const children = field.settings?.fields;
        if (field.type === "object" && !field.list && Array.isArray(children)) {
            rows.push(...flattenFields(children, isRecord(value) ? value : {}, segments));
            continue;
        }
        rows.push({
            path: segments.join("."),
            label: field.label,
            type: field.type,
            value: value === undefined ? null : value,
            writable: !field.list && WRITABLE_FIELD_TYPES.includes(field.type)
        });
    }
    return rows;
};

/**
 * The fields of a CMS revision as the target editor shows them (R172): every field, nested
 * `object` fields flattened to dotted paths, `writable` only for top-level or nested-object fields
 * of a writable type that are not `multipleValues` (`field.list`). A list object is one read-only
 * row and is never descended into, so nothing inside a `multipleValues` object is writable. Pure.
 */
export const toEditorFields = (
    model: Pick<CmsModel, "fields">,
    values: CmsEntryValues
): ReviewTargetEditorField[] => {
    return flattenFields(model.fields, values, []);
};
```

Create `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewTargetEditor.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { getEntryTitle } from "@webiny/api-headless-cms/utils/getEntryTitle.js";
import { ReviewTargetEditor } from "@webiny/api-workflows/features/review/ReviewTargetEditor/index.js";
import type {
    ReviewTargetContent,
    ReviewTargetEditorReadParams,
    ReviewTargetEditorUpdateParams,
    ReviewTargetEditorUpdateResult
} from "@webiny/api-workflows/features/review/ReviewTargetEditor/abstractions.js";
import { ReviewTargetEditorError } from "@webiny/api-workflows/domain/review/errors.js";
import { isCmsNamespace } from "~/utils/appName.js";
import { CmsEntryTargetReader } from "./CmsEntryTargetReader/index.js";
import { toEditorFields } from "./toEditorFields.js";

/**
 * The `cms.<modelId>` editor of the AI step's built-in tools (spec 9.3, R172). `read` returns the
 * whole revision; the model and group are read as the request identity through
 * `CmsEntryTargetReader` (SEC-66). Throws become failed Results with a text safe to show the model
 * (R87).
 */
class CmsEntryReviewTargetEditorImpl implements ReviewTargetEditor.Interface {
    public constructor(
        private targets: CmsEntryTargetReader.Interface,
        private logger: Logger.Interface
    ) {}

    public canEdit(model: string): boolean {
        return isCmsNamespace(model);
    }

    public async read(
        params: ReviewTargetEditorReadParams
    ): Promise<Result<ReviewTargetContent, ReviewTargetEditorError>> {
        try {
            const target = await this.targets.read({
                model: params.model,
                targetRevisionId: params.targetRevisionId
            });
            if (!target || target.entry.entryId !== params.targetId) {
                return Result.fail(new ReviewTargetEditorError("The target was not found."));
            }

            // Inside the try: a malformed model makes these throw, and that must be a failed
            // Result, never a rejection (R87).
            return Result.ok({
                title: getEntryTitle(target.model, target.entry),
                fields: toEditorFields(target.model, target.entry.values)
            });
        } catch (error) {
            this.logger.error(
                { error, model: params.model, targetId: params.targetId },
                "Could not read the target for the AI editor."
            );
            return Result.fail(new ReviewTargetEditorError("The target could not be read."));
        }
    }

    public async update(
        _params: ReviewTargetEditorUpdateParams
    ): Promise<Result<ReviewTargetEditorUpdateResult, ReviewTargetEditorError>> {
        return Result.fail(new ReviewTargetEditorError("This target cannot be edited."));
    }
}

export const CmsEntryReviewTargetEditor = ReviewTargetEditor.createImplementation({
    implementation: CmsEntryReviewTargetEditorImpl,
    dependencies: [CmsEntryTargetReader, Logger]
});
```

Modify `packages/api-headless-cms-workflows/src/features/target/feature.ts`: add the import `import { CmsEntryReviewTargetEditor } from "./CmsEntryReviewTargetEditor.js";` after the `CmsEntryReviewTargetFolderChain` import, and register it after the four engine ports:

```ts
        container.register(CmsEntryReviewTargetFolderChain);

        // The AI step's editor port, one per namespace (R172).
        container.register(CmsEntryReviewTargetEditor);
```

- [ ] **Step 4: Run them to verify they pass**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/target/toEditorFields.test.ts packages/api-headless-cms-workflows/__tests__/target/CmsEntryReviewTargetEditorRead.test.ts packages/api-headless-cms-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-headless-cms-workflows/__tests__/target/toEditorFields.test.ts packages/api-headless-cms-workflows/__tests__/target/CmsEntryReviewTargetEditorRead.test.ts packages/api-headless-cms-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code**

`target/feature.ts` is the gate of every CMS adapter port, and the new profile model is only registered by the new tests:

Run: `yarn test packages/api-headless-cms-workflows/__tests__/target/CmsEntryAdapter.test.ts packages/api-headless-cms-workflows/__tests__/target/CmsEntryAccess.test.ts packages/api-headless-cms-workflows/__tests__/wrappers/listWorkflowModels.test.ts 2>&1 | tail -50`
Expected: PASS.
Run the same with `yarn test:os` (one run at a time). Expected: PASS.

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms-workflows`, restore `.gitleaks.toml`), then commit:

```
feat(api-headless-cms-workflows): add the CMS review target editor read

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
