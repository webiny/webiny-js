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
import {
    createProfileEntry,
    PROFILE_VALUES,
    readProfile
} from "~tests/__helpers/profileEntries.js";
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
            ["birthday", "datetime", true],
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
        // The CMS reads a datetime as a Date; the AI gets the ISO string.
        const stored = (await readProfile(context, entry.id)).values.joinedOn as Date;
        expect(byPath.joinedOn.value).toBe(stored.toISOString());
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

    it("reads as the request identity: a user who cannot read the model gets nothing", async () => {
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
});
