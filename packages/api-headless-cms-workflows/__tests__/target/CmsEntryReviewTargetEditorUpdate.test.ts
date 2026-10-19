import { beforeEach, describe, expect, it } from "vitest";
import { ReviewTargetEditor } from "@webiny/api-workflows/features/review/ReviewTargetEditor/index.js";
import { WorkflowBypassService } from "@webiny/api-workflows/features/bypass/WorkflowBypassService/index.js";
import type { CmsContext, CmsEntry, CmsEntryValues } from "@webiny/api-headless-cms/types/index.js";
import { createTestContext } from "~tests/__helpers/testContext.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import {
    malformedModelCmsEntryTargetReader,
    throwingCmsEntryTargetReader
} from "~tests/__helpers/ThrowingCmsEntryTargetReader.js";
import { failUpdateEntry, updateEntryFaults } from "~tests/__helpers/FailingUpdateEntry.js";
import {
    createProfileEntry,
    PROFILE_VALUES,
    readProfile
} from "~tests/__helpers/profileEntries.js";
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

/** The created entry as the CMS reads it back, so its values compare with later reads. */
const createEntry = async (context: CmsContext, values?: CmsEntryValues): Promise<CmsEntry> => {
    const created = await createProfileEntry(context, values);
    return readProfile(context, created.id);
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
        const entry = await createEntry(context);

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
            joinedOn: new Date("2025-02-01T09:30:00")
        });
        expect(stored.values.tags).toEqual(["a", "b"]);
        expect(stored.values.contacts).toEqual([{ email: "ann@example.com" }]);
    });

    it("writes a nested field by dotted path and keeps its siblings", async () => {
        const context = await createProfileContext();
        const entry = await createEntry(context);

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
        const entry = await createEntry(context);

        const result = await update(context, entry, {
            "address.street": "Elm Street",
            "address.location.label": "Work"
        });

        expect(result.isOk()).toBe(true);
        const address = (await readProfile(context, entry.id)).values.address as Record<
            string,
            unknown
        >;
        expect(address.landlord).toEqual(
            (PROFILE_VALUES.address as Record<string, unknown>).landlord
        );
        expect(address.labels).toEqual(["home", "main"]);
        expect(address.street).toBe("Elm Street");
    });

    it("writes a two-level nested field and several nested paths at once", async () => {
        const context = await createProfileContext();
        const entry = await createEntry(context);

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
        const entry = await createEntry(context, { name: "Ann", age: 30 });

        const result = await update(context, entry, { "address.street": "Elm Street" });

        expect(result.isOk()).toBe(true);
        const stored = await readProfile(context, entry.id);
        expect(stored.values.address).toMatchObject({ street: "Elm Street" });
    });

    it("writes a date-subtype value in YYYY-MM-DD form and the datetime form read gives, and reads them back unchanged", async () => {
        const context = await createProfileContext();
        const entry = await createEntry(context);
        const before = await getEditor(context).read({
            model: PROFILE_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: entry.id
        });
        const given = before.value!.fields.find(item => item.path === "joinedOn")!.value as string;

        const result = await update(context, entry, { birthday: "1990-05-17", joinedOn: given });

        expect(result.isOk()).toBe(true);
        const after = await getEditor(context).read({
            model: PROFILE_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: entry.id
        });
        const byPath = Object.fromEntries(after.value!.fields.map(item => [item.path, item.value]));
        expect(byPath.birthday).toBe("1990-05-17");
        expect(byPath.joinedOn).toBe(given);
    });

    it("clears a field with null", async () => {
        const context = await createProfileContext();
        const entry = await createEntry(context);

        const result = await update(context, entry, { bio: null });

        expect(result.isOk()).toBe(true);
        expect((await readProfile(context, entry.id)).values.bio).toBeNull();
    });

    it("rejects an unknown path, naming it, and writes nothing (atomic)", async () => {
        const context = await createProfileContext();
        const entry = await createEntry(context);

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
        const entry = await createEntry(context);

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
        const entry = await createEntry(context);

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
        const entry = await createEntry(context);

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
        const entry = await createEntry(context);

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
        const entry = await createEntry(context);

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
        const entry = await createEntry(context);
        updateEntryFaults.validationData = [
            { fieldId: "age", parents: [], error: "Age must be 0 or more." },
            { fieldId: "bio", parents: [], error: "connect ECONNREFUSED 10.0.0.5:9200" },
            {
                fieldId: "street",
                parents: ["address"],
                error: 'There are no "street" validators defined.'
            }
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
            err: "connect ECONNREFUSED 10.0.0.5:9200",
            model: PROFILE_NAMESPACE,
            targetId: entry.entryId,
            path: "bio"
        });
    });

    it("fails with a generic text and one log for a malformed model instead of rejecting (R87)", async () => {
        const context = await createProfileContext([malformedModelCmsEntryTargetReader]);
        const entry = await createEntry(context);

        const result = await update(context, entry, { name: "Changed" });

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("The target could not be read.");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not read the target for the AI editor.");
        expect((await readProfile(context, entry.id)).values).toEqual(entry.values);
    });

    it("fails for no fields without touching the target", async () => {
        const context = await createProfileContext();
        const entry = await createEntry(context);

        const result = await update(context, entry, {});

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("No fields were given.");
    });

    it("fails for a missing revision and for a revision of another entry", async () => {
        const context = await createProfileContext();
        const entry = await createEntry(context);

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
        const entry = await createEntry(context);

        const result = await update(context, entry, { name: "Changed" });

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("The target could not be read.");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not read the target for the AI editor.");
        expect((await readProfile(context, entry.id)).values).toEqual(entry.values);
    });

    it("logs a throwing update and fails with a generic text instead of rejecting (R87)", async () => {
        const context = await createProfileContext([failUpdateEntry]);
        const entry = await createEntry(context);
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
        const entry = await createEntry(admin);
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
            err: { code: "Cms/Entry/NotAuthorized" }
        });
        expect((await readProfile(admin, entry.id)).values).toEqual(entry.values);
    });

    it("is blocked by the save block of a revision under review unless the bypass is active (R173)", async () => {
        const context = await createProfileContext();
        expectOk(await storeWorkflow(context, createWorkflowValues([PROFILE_NAMESPACE])));
        const entry = await createEntry(context);
        await requestEntryReview(context, entry, undefined, PROFILE_NAMESPACE);
        const bypass = context.container.resolve(WorkflowBypassService);

        const outside = await update(context, entry, { age: 41 });
        const inside = await bypass.run(() => update(context, entry, { age: 42 }));
        const after = await update(context, entry, { age: 43 });

        expect(outside.isFail()).toBe(true);
        expect(outside.error.message).toBe("The target could not be updated.");
        expect(loggedErrors[0].fields).toMatchObject({
            err: { code: "Workflows/Review/TargetLocked" }
        });
        expect(inside.isOk()).toBe(true);
        expect((await readProfile(context, entry.id)).values.age).toBe(42);
        expect(after.isFail()).toBe(true);
        expect(bypass.isActive()).toBe(false);
    });

    it("a bypassed write changes the values only: the review stays in progress and the bypass is closed after", async () => {
        const context = await createProfileContext();
        expectOk(await storeWorkflow(context, createWorkflowValues([PROFILE_NAMESPACE])));
        const entry = await createEntry(context);
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
