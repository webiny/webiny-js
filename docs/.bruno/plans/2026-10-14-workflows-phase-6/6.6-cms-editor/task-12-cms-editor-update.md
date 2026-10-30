### Task 12: CMS editor `update`

Spec 9.3; D36, D55, D62; R87, R150, R172, R173; SEC-66; Review Focus 3 and 4. `CmsEntryReviewTargetEditor.update` (Task 11 left a stub) writes the bounded set of fields, atomically, through the CMS entry update path. Behaviour, in this order:

1. **Input.** `values` is `Record<string, unknown>` keyed by the dotted paths `read` returned (`readTarget`'s output). No keys: `ReviewTargetEditorError("No fields were given.")`, nothing read or written. The applied list is `Object.keys(values)` in input order.
2. **Target.** The revision is read again through `CmsEntryTargetReader` (as the request identity, SEC-66): a missing revision or one of another entry fails with `The target was not found.`; a throwing reader is logged (`Could not read the target for the AI editor.`) and fails with `The target could not be read.` (R87).
3. **Path rules (R172).** Every key is looked up in a `Map` built from `toEditorFields(model, entry.values)` (never by indexing `values`, so `__proto__` and other junk are plain unknown keys). A key that is not a row fails with `Unknown field "<path>". Use the paths returned by readTarget.` (this includes the path of an object, whose children are the rows, and any path the model does not define); a read-only row (`writable: false`: lists, `multipleValues` objects, references, files, rich text, dynamic zones, other types) fails with `The field "<path>" is read-only.`; a value of the wrong JavaScript type for the field type fails with `The field "<path>" expects <description>.` (`isEditorFieldValue`: `null` is always accepted and clears the field, so the model's own `required` validator decides; `text` and `long-text` a string, `number` a finite number, `boolean` a boolean, `datetime` a string whose format the CMS validates). All problems are collected and returned in one error (joined with a space), so the model can correct every path in one go. Nothing is written when there is any problem (atomic).
4. **Merge.** `toEntryValuesPatch(entry.values, values)` builds the patch: top-level keys only, a nested path rebuilds a copy of its object chain from the current values so siblings survive (the CMS update merges top-level keys only: a bare `{ address: { street } }` would drop `zip` and `location`), an object that is `null` or missing is created. The current values are never mutated.
5. **Write.** One `UpdateEntryUseCase.execute(model, targetRevisionId, { values: patch })` call: the CMS validates the whole merged entry (field validators, required, datetime formats, nested fields) before persisting, so a bad value rejects the call and nothing is stored (atomic). The bypass is already active around this call (R173, `updateTargetFields` wraps `update` in `WorkflowBypassService.run`); this class neither reads nor sets it and adds no authorization switch: the write runs with the identity and authorization state of the task (requester, authorization off, R161). Success returns `{ applied }`.
6. **Failures (R87).** A validation failure (`result.error.code === "Cms/Entry/ValidationError"`, compared by code, not `instanceof`) becomes `ReviewTargetEditorError("Validation failed: <path>: <message> ...")` (one `<path>: <message>` per invalid field, `path` is the dotted path from `parents` plus `fieldId`, messages joined with a space; `Validation failed.` when the data is empty). Only messages that are safe to show the model are forwarded: a validator's own configured message (`validation[].message` or `listValidation[].message` of the field at that path) and the CMS's fixed datetime-format and predefined-value texts (`getModelSafeValidationMessage`, pure). The CMS validation turns a validator that THREW into its raw `ex.message` (and a validator name nobody registered into `There are no "<name>" validators defined.`), which can carry provider or storage detail: for such a field the model gets the generic `The value could not be validated.` and the raw error is logged with `Logger.error({ error, model, targetId, path }, "A field validator failed while the AI editor updated the target.")`. Every other failure (locked or blocked revision, no permission, persistence, `TargetLocked` from the save block outside the bypass) is logged with `Logger.error({ error, model, targetId }, "Could not update the target from the AI editor.")` and returns `ReviewTargetEditorError("The target could not be updated.")`; a throwing use case, a throwing target reader and a malformed model (`toEditorFields` throwing) are handled the same way (the whole body, reads and patch building included, runs inside one `try`). The method never rejects.

**Files:**
- Create: `packages/api-headless-cms-workflows/src/features/target/isEditorFieldValue.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/toEntryValuesPatch.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/getModelSafeValidationMessage.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewTargetEditor.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/target/CmsEntryReviewTargetEditorRead.test.ts` (remove the "refuses to update until Task 12" test)
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/FailingUpdateEntry.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/target/isEditorFieldValue.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/target/toEntryValuesPatch.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/target/getModelSafeValidationMessage.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/target/CmsEntryReviewTargetEditorUpdate.test.ts`

**Interfaces:**
- Consumes:
  - Task 11: `CmsEntryReviewTargetEditor` (`~/features/target/CmsEntryReviewTargetEditor.js`; the class `CmsEntryReviewTargetEditorImpl` with constructor `(targets: CmsEntryTargetReader.Interface, logger: Logger.Interface)`, `canEdit`, `read`, stub `update`), `toEditorFields(model: Pick<CmsModel, "fields">, values: CmsEntryValues): ReviewTargetEditorField[]` (`~/features/target/toEditorFields.js`), fixtures `profileModel`, `PROFILE_NAMESPACE`, `createProfilePlugins` (`~tests/__cms/profileModel.js`), `createProfileEntry`, `readProfile`, `PROFILE_VALUES` (`~tests/__helpers/profileEntries.js`), `throwingCmsEntryTargetReader`, `malformedModelCmsEntryTargetReader` (`~tests/__helpers/ThrowingCmsEntryTargetReader.js`); the profile fixture now has the read-only `address.landlord` (ref) and `address.labels` (list) children.
  - Task 9: `ReviewTargetEditor`, `ReviewTargetEditorUpdateParams` (`{ model, targetId, targetRevisionId, values: Record<string, unknown> }`), `ReviewTargetEditorUpdateResult` (`{ applied: string[] }`), `ReviewTargetEditorError`.
  - Existing: `UpdateEntryUseCase` (`@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js`; `execute(model, id, { values }, options?): Promise<Result<CmsEntry, Error>>`, merges top-level keys only, validates the merged values, fails with `EntryValidationError` (`@webiny/api-headless-cms/domain/contentEntry/errors.js`, `data: { id, fieldId, storageId, error, parents }[]`), `EntryNotAuthorizedError`, `EntryLockedError` or the persistence error), `WorkflowBypassService` (`@webiny/api-workflows/features/bypass/WorkflowBypassService/index.js`; `run<T>(callback)`, `isActive()`), `BlockUpdateWhileInReview` (registered by the CMS hooks feature; fails an update of a revision under review with `Workflows/Review/TargetLocked` unless the bypass is active), `Logger`.
  - Test helpers: `createTestContext`, `createUserContext`, `captureLoggedErrors`, `loggedErrors`, `storeWorkflow`, `createWorkflowValues` (`~tests/__workflows/workflow.js`), `requestEntryReview` (`~tests/__helpers/engine.js`; `(context, entry, requester?, model?)`), `READER` (`~tests/__helpers/identities.js`), `CMS_READER` (`~tests/__helpers/permissions.js`), `expectOk`.
- Produces (matches the contract):
  - `CmsEntryReviewTargetEditor.update(params): Promise<Result<{ applied: string[] }, ReviewTargetEditorError>>`, atomic and bounded as above. Consumed by Task 20 (CMS end-to-end AI run).
  - `isEditorFieldValue(type: string, value: unknown): boolean` and `describeEditorFieldValue(type: string): string` (`~/features/target/isEditorFieldValue.js`), pure.
  - `toEntryValuesPatch(current: CmsEntryValues, updates: Record<string, unknown>): Record<string, unknown>` (`~/features/target/toEntryValuesPatch.js`), pure.
  - `getModelSafeValidationMessage(model: Pick<CmsModel, "fields">, path: string[], error: unknown): string | null` and `GENERIC_VALIDATION_MESSAGE` (`~/features/target/getModelSafeValidationMessage.js`), pure.
  - Test helper `updateEntryFaults` (`throwing`, `validationData`), `failUpdateEntry` (`~tests/__helpers/FailingUpdateEntry.js`).

- [ ] **Step 1: Write the failing tests**

Create `packages/api-headless-cms-workflows/__tests__/__helpers/FailingUpdateEntry.ts`:

```ts
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { EntryValidationError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";
import type {
    CmsEntryValues,
    CmsModel,
    UpdateCmsEntryOptionsInput
} from "@webiny/api-headless-cms/types/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";

export interface UpdateEntryFaults {
    /** Makes `UpdateEntryUseCase` throw. */
    throwing: boolean;
    /** Makes `UpdateEntryUseCase` fail with an `EntryValidationError` carrying these items. */
    validationData: Array<{ fieldId: string; parents: string[]; error: unknown }> | null;
}

/** Reset it in `beforeEach`. */
export const updateEntryFaults: UpdateEntryFaults = { throwing: false, validationData: null };

class FailingUpdateEntry implements UpdateEntryUseCase.Interface {
    public constructor(private decoratee: UpdateEntryUseCase.Interface) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        input: UpdateEntryUseCase.Input<T>,
        options?: UpdateCmsEntryOptionsInput
    ): UpdateEntryUseCase.Return<T> {
        if (updateEntryFaults.throwing) {
            throw new Error("Storage is down.");
        }
        if (updateEntryFaults.validationData) {
            return Result.fail(
                new EntryValidationError("Validation failed.", updateEntryFaults.validationData)
            );
        }
        return this.decoratee.execute<T>(model, id, input, options);
    }
}

/** Makes `UpdateEntryUseCase` throw or fail validation as `updateEntryFaults` says (`legacyPlugins`). */
export const failUpdateEntry = (container: Container) => {
    container.registerDecorator(
        UpdateEntryUseCase.createDecorator({ decorator: FailingUpdateEntry, dependencies: [] })
    );
};
```

Create `packages/api-headless-cms-workflows/__tests__/target/isEditorFieldValue.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
    describeEditorFieldValue,
    isEditorFieldValue
} from "~/features/target/isEditorFieldValue.js";

describe("isEditorFieldValue", () => {
    it.each([
        ["text", "a", true],
        ["text", "", true],
        ["text", 1, false],
        ["text", true, false],
        ["text", ["a"], false],
        ["long-text", "a long text", true],
        ["long-text", {}, false],
        ["number", 3, true],
        ["number", 0, true],
        ["number", -1.5, true],
        ["number", "3", false],
        ["number", Number.NaN, false],
        ["number", Number.POSITIVE_INFINITY, false],
        ["boolean", true, true],
        ["boolean", false, true],
        ["boolean", "true", false],
        ["boolean", 1, false],
        ["datetime", "2024-01-15T10:00:00", true],
        ["datetime", 1705312800000, false],
        ["ref", "x", false],
        ["file", "x", false]
    ])("%s accepts %j: %s", (type, value, expected) => {
        expect(isEditorFieldValue(type, value)).toBe(expected);
    });

    it("accepts null for every writable type, so a required validator decides", () => {
        for (const type of ["text", "long-text", "number", "boolean", "datetime"]) {
            expect(isEditorFieldValue(type, null)).toBe(true);
        }
    });

    it("rejects undefined", () => {
        expect(isEditorFieldValue("text", undefined)).toBe(false);
    });

    it("describes what each writable type expects", () => {
        expect(describeEditorFieldValue("text")).toBe("a string");
        expect(describeEditorFieldValue("long-text")).toBe("a string");
        expect(describeEditorFieldValue("number")).toBe("a number");
        expect(describeEditorFieldValue("boolean")).toBe("true or false");
        expect(describeEditorFieldValue("datetime")).toBe("a date or time string");
    });
});
```

Create `packages/api-headless-cms-workflows/__tests__/target/toEntryValuesPatch.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { toEntryValuesPatch } from "~/features/target/toEntryValuesPatch.js";

const current = () => ({
    name: "Ann",
    age: 30,
    address: { street: "Main", zip: 1000, location: { label: "Home", floor: 2 } },
    tags: ["a"]
});

describe("toEntryValuesPatch", () => {
    it("patches a top-level key and leaves the others out", () => {
        expect(toEntryValuesPatch(current(), { name: "Bob" })).toEqual({ name: "Bob" });
    });

    it("keeps the siblings of a nested key", () => {
        expect(toEntryValuesPatch(current(), { "address.street": "Elm" })).toEqual({
            address: { street: "Elm", zip: 1000, location: { label: "Home", floor: 2 } }
        });
    });

    it("keeps the siblings of a deeply nested key at every level", () => {
        expect(toEntryValuesPatch(current(), { "address.location.label": "Work" })).toEqual({
            address: { street: "Main", zip: 1000, location: { label: "Work", floor: 2 } }
        });
    });

    it("merges several paths of the same object into one object", () => {
        const patch = toEntryValuesPatch(current(), {
            "address.street": "Elm",
            "address.location.label": "Work",
            "address.zip": 2000,
            age: 31
        });

        expect(patch).toEqual({
            address: { street: "Elm", zip: 2000, location: { label: "Work", floor: 2 } },
            age: 31
        });
    });

    it("creates an object that is null or missing", () => {
        expect(toEntryValuesPatch({ address: null }, { "address.street": "Elm" })).toEqual({
            address: { street: "Elm" }
        });
        expect(toEntryValuesPatch({}, { "address.location.label": "Work" })).toEqual({
            address: { location: { label: "Work" } }
        });
    });

    it("writes null as a value", () => {
        expect(toEntryValuesPatch(current(), { "address.zip": null })).toMatchObject({
            address: { zip: null, street: "Main" }
        });
    });

    it("never mutates the current values and copies every object it changes", () => {
        const values = current();
        const snapshot = JSON.parse(JSON.stringify(values));

        const patch = toEntryValuesPatch(values, { "address.location.label": "Work" });

        expect(values).toEqual(snapshot);
        expect((patch.address as object) === values.address).toBe(false);
        expect(
            ((patch.address as Record<string, unknown>).location as object) ===
                values.address.location
        ).toBe(false);
    });

    it("does not touch the prototype", () => {
        const patch = toEntryValuesPatch({}, { name: "Ann" });

        expect(Object.getPrototypeOf(patch)).toBe(Object.prototype);
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });
});
```

Create `packages/api-headless-cms-workflows/__tests__/target/getModelSafeValidationMessage.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import { getModelSafeValidationMessage } from "~/features/target/getModelSafeValidationMessage.js";

const model = {
    fields: [
        {
            id: "age",
            storageId: "number@age",
            fieldId: "age",
            type: "number",
            label: "Age",
            validation: [{ name: "gte", message: "Age must be 0 or more.", settings: { value: 0 } }],
            listValidation: []
        },
        {
            id: "tags",
            storageId: "text@tags",
            fieldId: "tags",
            type: "text",
            label: "Tags",
            list: true,
            validation: [],
            listValidation: [{ name: "minLength", message: "Add at least one tag." }]
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
                fields: [
                    {
                        id: "zip",
                        storageId: "number@zip",
                        fieldId: "zip",
                        type: "number",
                        label: "Zip",
                        validation: [{ name: "required", message: "Zip is required." }],
                        listValidation: []
                    }
                ]
            }
        }
    ] as CmsModelField[]
} as Pick<CmsModel, "fields">;

describe("getModelSafeValidationMessage", () => {
    it("forwards a message the field's own validator configured", () => {
        expect(getModelSafeValidationMessage(model, ["age"], "Age must be 0 or more.")).toBe(
            "Age must be 0 or more."
        );
    });

    it("forwards a configured list validation message and a nested field's message", () => {
        expect(getModelSafeValidationMessage(model, ["tags"], "Add at least one tag.")).toBe(
            "Add at least one tag."
        );
        expect(getModelSafeValidationMessage(model, ["address", "zip"], "Zip is required.")).toBe(
            "Zip is required."
        );
    });

    it("forwards the fixed datetime format and predefined value texts of the CMS", () => {
        const datetime = 'Invalid dateTime format for field "joinedOn". Expected ISO 8601 dateTime.';
        const predefined = "Value sent does not match any of the available predefined values.";

        expect(getModelSafeValidationMessage(model, ["joinedOn"], datetime)).toBe(datetime);
        expect(getModelSafeValidationMessage(model, ["age"], predefined)).toBe(predefined);
    });

    it("hides a raw thrown message and an unregistered validator text", () => {
        expect(
            getModelSafeValidationMessage(model, ["age"], "connect ECONNREFUSED 10.0.0.5:9200")
        ).toBeNull();
        expect(
            getModelSafeValidationMessage(model, ["age"], 'There are no "gte" validators defined.')
        ).toBeNull();
    });

    it("hides another field's configured message and anything for an unknown path", () => {
        expect(getModelSafeValidationMessage(model, ["address", "zip"], "Age must be 0 or more.")).toBeNull();
        expect(getModelSafeValidationMessage(model, ["nope"], "Age must be 0 or more.")).toBeNull();
        expect(getModelSafeValidationMessage(model, ["tags", "0", "x"], "Add at least one tag.")).toBeNull();
    });

    it("hides an error that is not a string", () => {
        expect(getModelSafeValidationMessage(model, ["age"], undefined)).toBeNull();
        expect(getModelSafeValidationMessage(model, ["age"], { message: "x" })).toBeNull();
    });
});
```

Create `packages/api-headless-cms-workflows/__tests__/target/CmsEntryReviewTargetEditorUpdate.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { ReviewTargetEditor } from "@webiny/api-workflows/features/review/ReviewTargetEditor/index.js";
import { WorkflowBypassService } from "@webiny/api-workflows/features/bypass/WorkflowBypassService/index.js";
import type { CmsContext, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { createTestContext } from "~tests/__helpers/testContext.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import {
    malformedModelCmsEntryTargetReader,
    throwingCmsEntryTargetReader
} from "~tests/__helpers/ThrowingCmsEntryTargetReader.js";
import { failUpdateEntry, updateEntryFaults } from "~tests/__helpers/FailingUpdateEntry.js";
import { createProfileEntry, PROFILE_VALUES, readProfile } from "~tests/__helpers/profileEntries.js";
import { createProfilePlugins, PROFILE_NAMESPACE } from "~tests/__cms/profileModel.js";
import { createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";
import { requestEntryReview } from "~tests/__helpers/engine.js";
import { expectOk } from "~tests/__helpers/entries.js";
import { READER } from "~tests/__helpers/identities.js";
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

const update = (
    context: CmsContext,
    entry: CmsEntry,
    values: Record<string, unknown>,
    targetId: string = entry.entryId
) => {
    return getEditor(context).update({
        model: PROFILE_NAMESPACE,
        targetId,
        targetRevisionId: entry.id,
        values
    });
};

beforeEach(() => {
    loggedErrors.length = 0;
    updateEntryFaults.throwing = false;
    updateEntryFaults.validationData = null;
});

describe("CmsEntryReviewTargetEditor.update", () => {
    it("writes top-level scalar fields and returns the applied paths in input order", async () => {
        const context = await createProfileContext();
        const entry = await createProfileEntry(context);

        const result = await update(context, entry, {
            age: 31,
            active: false,
            bio: "Writes more books.",
            joinedOn: "2025-02-01T09:30:00"
        });

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({ applied: ["age", "active", "bio", "joinedOn"] });
        const stored = await readProfile(context, entry.id);
        expect(stored.values).toMatchObject({
            name: "Ann",
            age: 31,
            active: false,
            bio: "Writes more books.",
            joinedOn: "2025-02-01T09:30:00"
        });
        expect(stored.values.tags).toEqual(["a", "b"]);
        expect(stored.values.contacts).toEqual([{ email: "ann@example.com" }]);
    });

    it("writes a nested field by dotted path and keeps its siblings", async () => {
        const context = await createProfileContext();
        const entry = await createProfileEntry(context);

        const result = await update(context, entry, { "address.street": "Elm Street" });

        expect(result.value).toEqual({ applied: ["address.street"] });
        const stored = await readProfile(context, entry.id);
        expect(stored.values.address).toEqual({
            street: "Elm Street",
            zip: 1000,
            location: { label: "Home" },
            landlord: { modelId: "author", entryId: "landlord", id: "landlord#0001" },
            labels: ["home", "main"]
        });
        expect(stored.values.name).toBe("Ann");
    });

    it("keeps the read-only children inside the written object: a reference and a list survive an address.street write (Review Focus 3)", async () => {
        const context = await createProfileContext();
        const entry = await createProfileEntry(context);

        const result = await update(context, entry, {
            "address.street": "Elm Street",
            "address.location.label": "Work"
        });

        expect(result.isOk()).toBe(true);
        const address = (await readProfile(context, entry.id)).values.address as Record<
            string,
            unknown
        >;
        expect(address.landlord).toEqual((PROFILE_VALUES.address as Record<string, unknown>).landlord);
        expect(address.labels).toEqual(["home", "main"]);
        expect(address.street).toBe("Elm Street");
    });

    it("writes a two-level nested field and several nested paths at once", async () => {
        const context = await createProfileContext();
        const entry = await createProfileEntry(context);

        const result = await update(context, entry, {
            "address.location.label": "Work",
            "address.zip": 2000,
            name: "Ann B."
        });

        expect(result.isOk()).toBe(true);
        const stored = await readProfile(context, entry.id);
        expect(stored.values.address).toEqual({
            street: "Main Street",
            zip: 2000,
            location: { label: "Work" },
            landlord: { modelId: "author", entryId: "landlord", id: "landlord#0001" },
            labels: ["home", "main"]
        });
        expect(stored.values.name).toBe("Ann B.");
    });

    it("creates a nested object that the entry does not have yet", async () => {
        const context = await createProfileContext();
        const entry = await createProfileEntry(context, { name: "Ann", age: 30 });

        const result = await update(context, entry, { "address.street": "Elm Street" });

        expect(result.isOk()).toBe(true);
        const stored = await readProfile(context, entry.id);
        expect(stored.values.address).toMatchObject({ street: "Elm Street" });
    });

    it("clears a field with null", async () => {
        const context = await createProfileContext();
        const entry = await createProfileEntry(context);

        const result = await update(context, entry, { bio: null });

        expect(result.isOk()).toBe(true);
        expect((await readProfile(context, entry.id)).values.bio).toBeNull();
    });

    it("rejects an unknown path, naming it, and writes nothing (atomic)", async () => {
        const context = await createProfileContext();
        const entry = await createProfileEntry(context);

        const result = await update(context, entry, { name: "Changed", nickname: "Annie" });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/ReviewTarget/EditorError");
        expect(result.error.message).toBe(
            'Unknown field "nickname". Use the paths returned by readTarget.'
        );
        expect((await readProfile(context, entry.id)).values).toEqual(entry.values);
        expect(loggedErrors).toEqual([]);
    });

    it("rejects the path of an object, an undefined nested path and prototype keys", async () => {
        const context = await createProfileContext();
        const entry = await createProfileEntry(context);

        const object = await update(context, entry, { address: { street: "x" } });
        const nested = await update(context, entry, { "address.country": "x" });
        const deep = await update(context, entry, { "address.location.label.extra": "x" });
        const proto = await update(
            context,
            entry,
            JSON.parse('{ "__proto__": { "polluted": true } }')
        );
        const constructorKey = await update(context, entry, { "constructor.prototype.x": 1 });

        for (const result of [object, nested, deep, proto, constructorKey]) {
            expect(result.isFail()).toBe(true);
            expect(result.error.message).toMatch(/^Unknown field /);
        }
        expect(object.error.message).toContain('"address"');
        expect(nested.error.message).toContain('"address.country"');
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
        expect((await readProfile(context, entry.id)).values).toEqual(entry.values);
    });

    it("rejects every read-only path (lists, list objects, references), writes nothing", async () => {
        const context = await createProfileContext();
        const entry = await createProfileEntry(context);

        const tags = await update(context, entry, { tags: ["x"] });
        const contacts = await update(context, entry, { contacts: [{ email: "x@y.z" }] });
        const employer = await update(context, entry, {
            employer: { modelId: "author", id: "a#0001" }
        });

        expect(tags.error.message).toBe('The field "tags" is read-only.');
        expect(contacts.error.message).toBe('The field "contacts" is read-only.');
        expect(employer.error.message).toBe('The field "employer" is read-only.');
        expect((await readProfile(context, entry.id)).values).toEqual(entry.values);
    });

    it("reports every bad path in one error and writes none of the good ones", async () => {
        const context = await createProfileContext();
        const entry = await createProfileEntry(context);

        const result = await update(context, entry, {
            name: "Changed",
            tags: ["x"],
            nickname: "Annie",
            age: "old"
        });

        expect(result.error.message).toBe(
            [
                'The field "tags" is read-only.',
                'Unknown field "nickname". Use the paths returned by readTarget.',
                'The field "age" expects a number.'
            ].join(" ")
        );
        expect((await readProfile(context, entry.id)).values).toEqual(entry.values);
    });

    it("rejects a value of the wrong type for every writable type", async () => {
        const context = await createProfileContext();
        const entry = await createProfileEntry(context);

        const results = await Promise.all([
            update(context, entry, { name: 5 }),
            update(context, entry, { bio: ["x"] }),
            update(context, entry, { age: "31" }),
            update(context, entry, { active: "yes" }),
            update(context, entry, { joinedOn: 1705312800000 }),
            update(context, entry, { "address.zip": "1000" })
        ]);

        expect(results.map(item => item.error.message)).toEqual([
            'The field "name" expects a string.',
            'The field "bio" expects a string.',
            'The field "age" expects a number.',
            'The field "active" expects true or false.',
            'The field "joinedOn" expects a date or time string.',
            'The field "address.zip" expects a number.'
        ]);
        expect((await readProfile(context, entry.id)).values).toEqual(entry.values);
    });

    it("runs the model validators and writes nothing when one fails (atomic)", async () => {
        const context = await createProfileContext();
        const entry = await createProfileEntry(context);

        const tooYoung = await update(context, entry, { bio: "New bio", age: -1 });
        const noName = await update(context, entry, { name: null });
        const badDate = await update(context, entry, { joinedOn: "yesterday" });

        expect(tooYoung.isFail()).toBe(true);
        expect(tooYoung.error.code).toBe("Workflows/ReviewTarget/EditorError");
        expect(tooYoung.error.message).toBe("Validation failed: age: Age must be 0 or more.");
        expect(noName.error.message).toBe("Validation failed: name: Name is required.");
        expect(badDate.error.message).toContain(
            'Validation failed: joinedOn: Invalid dateTime format for field "joinedOn".'
        );
        expect((await readProfile(context, entry.id)).values).toEqual(entry.values);
        expect(loggedErrors).toEqual([]);
    });

    it("forwards a configured validator message but hides a raw validator error behind a generic text and logs it (R87)", async () => {
        const context = await createProfileContext([failUpdateEntry]);
        const entry = await createProfileEntry(context);
        updateEntryFaults.validationData = [
            { fieldId: "age", parents: [], error: "Age must be 0 or more." },
            { fieldId: "bio", parents: [], error: "connect ECONNREFUSED 10.0.0.5:9200" },
            { fieldId: "street", parents: ["address"], error: 'There are no "street" validators defined.' }
        ];

        const result = await update(context, entry, { age: 31 });
        updateEntryFaults.validationData = null;

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe(
            [
                "Validation failed: age: Age must be 0 or more.",
                "bio: The value could not be validated.",
                "address.street: The value could not be validated."
            ].join(" ")
        );
        expect(result.error.message).not.toContain("ECONNREFUSED");
        expect(loggedErrors.map(item => item.message)).toEqual([
            "A field validator failed while the AI editor updated the target.",
            "A field validator failed while the AI editor updated the target."
        ]);
        expect(loggedErrors[0].fields).toMatchObject({
            error: "connect ECONNREFUSED 10.0.0.5:9200",
            model: PROFILE_NAMESPACE,
            targetId: entry.entryId,
            path: "bio"
        });
    });

    it("fails with a generic text and one log for a malformed model instead of rejecting (R87)", async () => {
        const context = await createProfileContext([malformedModelCmsEntryTargetReader]);
        const entry = await createProfileEntry(context);

        const result = await update(context, entry, { name: "Changed" });

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("The target could not be read.");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not read the target for the AI editor.");
        expect((await readProfile(context, entry.id)).values).toEqual(entry.values);
    });

    it("fails for no fields without touching the target", async () => {
        const context = await createProfileContext();
        const entry = await createProfileEntry(context);

        const result = await update(context, entry, {});

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("No fields were given.");
    });

    it("fails for a missing revision and for a revision of another entry", async () => {
        const context = await createProfileContext();
        const entry = await createProfileEntry(context);

        const missing = await getEditor(context).update({
            model: PROFILE_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: `${entry.entryId}#0009`,
            values: { name: "Changed" }
        });
        const mismatched = await update(context, entry, { name: "Changed" }, "another-entry");

        expect(missing.error.message).toBe("The target was not found.");
        expect(mismatched.error.message).toBe("The target was not found.");
        expect((await readProfile(context, entry.id)).values).toEqual(entry.values);
    });

    it("logs a throwing reader and fails with a generic text instead of rejecting (R87)", async () => {
        const context = await createProfileContext([throwingCmsEntryTargetReader]);
        const entry = await createProfileEntry(context);

        const result = await update(context, entry, { name: "Changed" });

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("The target could not be read.");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not read the target for the AI editor.");
        expect((await readProfile(context, entry.id)).values).toEqual(entry.values);
    });

    it("logs a throwing update and fails with a generic text instead of rejecting (R87)", async () => {
        const context = await createProfileContext([failUpdateEntry]);
        const entry = await createProfileEntry(context);
        updateEntryFaults.throwing = true;

        const result = await update(context, entry, { name: "Changed" });
        updateEntryFaults.throwing = false;

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("The target could not be updated.");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not update the target from the AI editor.");
        expect(loggedErrors[0].fields).toMatchObject({
            model: PROFILE_NAMESPACE,
            targetId: entry.entryId
        });
        expect((await readProfile(context, entry.id)).values).toEqual(entry.values);
    });

    it("does not widen access: a user without write access cannot write (generic text, logged)", async () => {
        const admin = await createProfileContext();
        const entry = await createProfileEntry(admin);
        const reader = await createUserContext({
            identity: READER,
            permissions: CMS_READER,
            legacyPlugins: [...createProfilePlugins(), captureLoggedErrors]
        });

        const result = await update(reader, entry, { name: "Changed" });

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("The target could not be updated.");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].fields).toMatchObject({
            error: { code: "Cms/Entry/NotAuthorized" }
        });
        expect((await readProfile(admin, entry.id)).values).toEqual(entry.values);
    });

    it("is blocked by the save block of a revision under review unless the bypass is active (R173)", async () => {
        const context = await createProfileContext();
        expectOk(await storeWorkflow(context, createWorkflowValues([PROFILE_NAMESPACE])));
        const entry = await createProfileEntry(context);
        await requestEntryReview(context, entry, undefined, PROFILE_NAMESPACE);
        const bypass = context.container.resolve(WorkflowBypassService);

        const outside = await update(context, entry, { age: 41 });
        const inside = await bypass.run(() => update(context, entry, { age: 42 }));
        const after = await update(context, entry, { age: 43 });

        expect(outside.isFail()).toBe(true);
        expect(outside.error.message).toBe("The target could not be updated.");
        expect(loggedErrors[0].fields).toMatchObject({
            error: { code: "Workflows/Review/TargetLocked" }
        });
        expect(inside.isOk()).toBe(true);
        expect((await readProfile(context, entry.id)).values.age).toBe(42);
        expect(after.isFail()).toBe(true);
        expect(bypass.isActive()).toBe(false);
    });

    it("a bypassed write changes the values only: the review stays in progress and the bypass is closed after", async () => {
        const context = await createProfileContext();
        expectOk(await storeWorkflow(context, createWorkflowValues([PROFILE_NAMESPACE])));
        const entry = await createProfileEntry(context);
        await requestEntryReview(context, entry, undefined, PROFILE_NAMESPACE);
        const bypass = context.container.resolve(WorkflowBypassService);

        const result = await bypass.run(() => update(context, entry, { "address.street": "Elm" }));

        expect(result.isOk()).toBe(true);
        expect((await readProfile(context, entry.id)).system?.workflow?.reviewState).toBe(
            "inProgress"
        );
        expect(bypass.isActive()).toBe(false);
    });
});
```

In `packages/api-headless-cms-workflows/__tests__/target/CmsEntryReviewTargetEditorRead.test.ts` delete the last test, `"refuses to update until Task 12"`.

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/target/isEditorFieldValue.test.ts packages/api-headless-cms-workflows/__tests__/target/toEntryValuesPatch.test.ts packages/api-headless-cms-workflows/__tests__/target/getModelSafeValidationMessage.test.ts packages/api-headless-cms-workflows/__tests__/target/CmsEntryReviewTargetEditorUpdate.test.ts 2>&1 | tail -50`
Expected: FAIL. `isEditorFieldValue.js` and `toEntryValuesPatch.js` do not exist (import errors); every update test fails with `This target cannot be edited.` (the Task 11 stub) where it expects ok or the specific texts.

Run the same with `yarn test:os` (one run at a time):
`yarn test:os packages/api-headless-cms-workflows/__tests__/target/isEditorFieldValue.test.ts packages/api-headless-cms-workflows/__tests__/target/toEntryValuesPatch.test.ts packages/api-headless-cms-workflows/__tests__/target/getModelSafeValidationMessage.test.ts packages/api-headless-cms-workflows/__tests__/target/CmsEntryReviewTargetEditorUpdate.test.ts 2>&1 | tail -50`
Expected: FAIL, same reason.

- [ ] **Step 3: Implement**

Create `packages/api-headless-cms-workflows/src/features/target/isEditorFieldValue.ts`:

```ts
/**
 * Whether `value` has the JavaScript type the CMS field type stores. The CMS update path validates
 * validators, required and datetime formats but does not type-check (the GraphQL schema does that
 * for API writes), so the editor does it before writing (R172). `null` clears a field and is
 * always accepted, so the model's own `required` validator decides. Pure.
 */
export const isEditorFieldValue = (type: string, value: unknown): boolean => {
    if (value === null) {
        return true;
    }
    switch (type) {
        case "text":
        case "long-text":
        case "datetime":
            return typeof value === "string";
        case "number":
            return typeof value === "number" && Number.isFinite(value);
        case "boolean":
            return typeof value === "boolean";
        default:
            return false;
    }
};

/** What the model should send for a writable field type, for the error text. Pure. */
export const describeEditorFieldValue = (type: string): string => {
    switch (type) {
        case "number":
            return "a number";
        case "boolean":
            return "true or false";
        case "datetime":
            return "a date or time string";
        default:
            return "a string";
    }
};
```

Create `packages/api-headless-cms-workflows/src/features/target/toEntryValuesPatch.ts`:

```ts
import type { CmsEntryValues } from "@webiny/api-headless-cms/types/index.js";

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * The `values` of the entry update for dotted-path writes. The CMS update merges top-level keys
 * only, so a nested write has to carry its whole object: every object on the way is a copy of the
 * current one with the new leaf set (siblings survive), and a `null` or missing object is created.
 * Only the touched top-level keys are in the patch. The paths are already checked against the
 * model (`toEditorFields`), so they are field ids. The current values are never mutated. Pure.
 */
export const toEntryValuesPatch = (
    current: CmsEntryValues,
    updates: Record<string, unknown>
): Record<string, unknown> => {
    const patch: Record<string, unknown> = {};
    for (const [path, value] of Object.entries(updates)) {
        const segments = path.split(".");
        const leaf = segments[segments.length - 1];
        let target = patch;
        let source: Record<string, unknown> = current;
        for (const segment of segments.slice(0, -1)) {
            const existing = target[segment];
            const original = source[segment];
            const copy = isRecord(existing) ? existing : isRecord(original) ? { ...original } : {};
            target[segment] = copy;
            target = copy;
            source = isRecord(original) ? original : {};
        }
        target[leaf] = value;
    }
    return patch;
};
```

Create `packages/api-headless-cms-workflows/src/features/target/getModelSafeValidationMessage.ts`:

```ts
import type { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types/index.js";

/** What the model reads when a field failed validation with a message it must not see. */
export const GENERIC_VALIDATION_MESSAGE = "The value could not be validated.";

const PREDEFINED_VALUE_MESSAGE =
    "Value sent does not match any of the available predefined values.";
const DATETIME_FORMAT_MESSAGE =
    /^Invalid (date|time|dateTime) format for field "[^"]*"\. Expected [^"]*\.$/;

const findField = (fields: CmsModelField[], path: string[]): CmsModelField | null => {
    let current: CmsModelField[] = fields;
    let found: CmsModelField | null = null;
    for (const segment of path) {
        found = current.find(item => item.fieldId === segment) ?? null;
        if (!found) {
            return null;
        }
        const children = found.settings?.fields;
        current = Array.isArray(children) ? children : [];
    }
    return found;
};

/**
 * The CMS validation turns a validator that THREW into its raw `ex.message`, and a validator
 * nobody registered into `There are no "<name>" validators defined.` Neither may reach the model
 * (R87). A message is safe to show when it is one the model author configured on that field
 * (`validation[].message`, `listValidation[].message`) or one of the CMS's own fixed datetime and
 * predefined-value texts. Returns the message when safe, otherwise `null`. Pure.
 */
export const getModelSafeValidationMessage = (
    model: Pick<CmsModel, "fields">,
    path: string[],
    error: unknown
): string | null => {
    if (typeof error !== "string") {
        return null;
    }
    if (error === PREDEFINED_VALUE_MESSAGE || DATETIME_FORMAT_MESSAGE.test(error)) {
        return error;
    }
    const field = findField(model.fields, path);
    if (!field) {
        return null;
    }
    const configured = [...(field.validation ?? []), ...(field.listValidation ?? [])].map(
        item => item.message
    );
    return configured.includes(error) ? error : null;
};
```

Replace `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewTargetEditor.ts` with (the constructor gains `updateEntry` and the stub becomes the real `update`; `read` is unchanged):

```ts
import { Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { getEntryTitle } from "@webiny/api-headless-cms/utils/getEntryTitle.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { ReviewTargetEditor } from "@webiny/api-workflows/features/review/ReviewTargetEditor/index.js";
import type {
    ReviewTargetContent,
    ReviewTargetEditorField,
    ReviewTargetEditorReadParams,
    ReviewTargetEditorUpdateParams,
    ReviewTargetEditorUpdateResult
} from "@webiny/api-workflows/features/review/ReviewTargetEditor/abstractions.js";
import { ReviewTargetEditorError } from "@webiny/api-workflows/domain/review/errors.js";
import { isCmsNamespace } from "~/utils/appName.js";
import { CmsEntryTargetReader } from "./CmsEntryTargetReader/index.js";
import { toEditorFields } from "./toEditorFields.js";
import { describeEditorFieldValue, isEditorFieldValue } from "./isEditorFieldValue.js";
import { toEntryValuesPatch } from "./toEntryValuesPatch.js";
import {
    GENERIC_VALIDATION_MESSAGE,
    getModelSafeValidationMessage
} from "./getModelSafeValidationMessage.js";

/**
 * The `cms.<modelId>` editor of the AI step's built-in tools (spec 9.3, R172). `read` returns the
 * whole revision; `update` writes top-level and nested object fields of the five writable types by
 * dotted path, atomically, through the CMS entry update (so field validators run). The model and
 * group are read as the request identity through `CmsEntryTargetReader` (SEC-66). The save-block
 * bypass is the tool's business (R173): this class neither reads nor sets it. Throws become failed
 * Results with a text safe to show the model (R87).
 */
class CmsEntryReviewTargetEditorImpl implements ReviewTargetEditor.Interface {
    public constructor(
        private targets: CmsEntryTargetReader.Interface,
        private updateEntry: UpdateEntryUseCase.Interface,
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
        params: ReviewTargetEditorUpdateParams
    ): Promise<Result<ReviewTargetEditorUpdateResult, ReviewTargetEditorError>> {
        const paths = Object.keys(params.values);
        if (paths.length === 0) {
            return Result.fail(new ReviewTargetEditorError("No fields were given."));
        }

        let target: CmsEntryTargetReader.Target;
        let patch: Record<string, unknown>;
        try {
            const read = await this.targets.read({
                model: params.model,
                targetRevisionId: params.targetRevisionId
            });
            if (!read || read.entry.entryId !== params.targetId) {
                return Result.fail(new ReviewTargetEditorError("The target was not found."));
            }
            target = read;

            // A Map, so a key such as "__proto__" is just an unknown path.
            const fields = new Map<string, ReviewTargetEditorField>();
            for (const field of toEditorFields(target.model, target.entry.values)) {
                fields.set(field.path, field);
            }
            const problems: string[] = [];
            for (const path of paths) {
                const field = fields.get(path);
                if (!field) {
                    problems.push(`Unknown field "${path}". Use the paths returned by readTarget.`);
                } else if (!field.writable) {
                    problems.push(`The field "${path}" is read-only.`);
                } else if (!isEditorFieldValue(field.type, params.values[path])) {
                    problems.push(
                        `The field "${path}" expects ${describeEditorFieldValue(field.type)}.`
                    );
                }
            }
            if (problems.length > 0) {
                return Result.fail(new ReviewTargetEditorError(problems.join(" ")));
            }

            patch = toEntryValuesPatch(target.entry.values, params.values);
        } catch (error) {
            this.logger.error(
                { error, model: params.model, targetId: params.targetId },
                "Could not read the target for the AI editor."
            );
            return Result.fail(new ReviewTargetEditorError("The target could not be read."));
        }

        try {
            const result = await this.updateEntry.execute(target.model, params.targetRevisionId, {
                values: patch
            });
            if (result.isFail()) {
                if (result.error.code === "Cms/Entry/ValidationError") {
                    const invalid: string[] = [];
                    for (const item of result.error.data ?? []) {
                        const itemPath: string[] = [...item.parents, item.fieldId];
                        const safe = getModelSafeValidationMessage(
                            target.model,
                            itemPath,
                            item.error
                        );
                        if (safe === null) {
                            // A validator that threw, or one nobody registered: raw text, never
                            // shown to the model.
                            this.logger.error(
                                {
                                    error: item.error,
                                    model: params.model,
                                    targetId: params.targetId,
                                    path: itemPath.join(".")
                                },
                                "A field validator failed while the AI editor updated the target."
                            );
                        }
                        invalid.push(`${itemPath.join(".")}: ${safe ?? GENERIC_VALIDATION_MESSAGE}`);
                    }
                    return Result.fail(
                        new ReviewTargetEditorError(
                            invalid.length > 0
                                ? `Validation failed: ${invalid.join(" ")}`
                                : "Validation failed."
                        )
                    );
                }
                this.logger.error(
                    { error: result.error, model: params.model, targetId: params.targetId },
                    "Could not update the target from the AI editor."
                );
                return Result.fail(new ReviewTargetEditorError("The target could not be updated."));
            }
        } catch (error) {
            this.logger.error(
                { error, model: params.model, targetId: params.targetId },
                "Could not update the target from the AI editor."
            );
            return Result.fail(new ReviewTargetEditorError("The target could not be updated."));
        }

        return Result.ok({ applied: paths });
    }
}

export const CmsEntryReviewTargetEditor = ReviewTargetEditor.createImplementation({
    implementation: CmsEntryReviewTargetEditorImpl,
    dependencies: [CmsEntryTargetReader, UpdateEntryUseCase, Logger]
});
```

- [ ] **Step 4: Run them to verify they pass**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/target/isEditorFieldValue.test.ts packages/api-headless-cms-workflows/__tests__/target/toEntryValuesPatch.test.ts packages/api-headless-cms-workflows/__tests__/target/getModelSafeValidationMessage.test.ts packages/api-headless-cms-workflows/__tests__/target/CmsEntryReviewTargetEditorUpdate.test.ts 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-headless-cms-workflows/__tests__/target/isEditorFieldValue.test.ts packages/api-headless-cms-workflows/__tests__/target/toEntryValuesPatch.test.ts packages/api-headless-cms-workflows/__tests__/target/getModelSafeValidationMessage.test.ts packages/api-headless-cms-workflows/__tests__/target/CmsEntryReviewTargetEditorUpdate.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code**

The editor file is shared with Task 11, and the update path crosses the save block and the bypass:

Run: `yarn test packages/api-headless-cms-workflows/__tests__/target/toEditorFields.test.ts packages/api-headless-cms-workflows/__tests__/target/CmsEntryReviewTargetEditorRead.test.ts packages/api-headless-cms-workflows/__tests__/registration.test.ts packages/api-headless-cms-workflows/__tests__/hooks/revisionAndSaveBlock.test.ts packages/api-headless-cms-workflows/__tests__/target/CmsEntryAdapter.test.ts 2>&1 | tail -50`
Expected: PASS.
Run the same with `yarn test:os` (one run at a time). Expected: PASS.

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms-workflows`, restore `.gitleaks.toml`), then commit:

```
feat(api-headless-cms-workflows): write top-level and nested fields from the CMS review target editor

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
