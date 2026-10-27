import type { CmsContext, CmsEntry, CmsEntryValues } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/index.js";
import { expectOk, getAuthorModel } from "./entries.js";

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

/** The referenced entry of `PROFILE_VALUES.address.landlord`; the CMS refuses a dangling reference. */
const ensureLandlord = async (context: CmsContext): Promise<void> => {
    const authorModel = await getAuthorModel(context);
    const existing = await context.container
        .resolve(GetRevisionByIdUseCase)
        .execute(authorModel, "landlord#0001");
    if (existing.isOk()) {
        return;
    }
    expectOk(
        await context.container.resolve(CreateEntryUseCase).execute(authorModel, {
            id: "landlord",
            values: { name: "Landlord" },
            location: { folderId: "root" }
        })
    );
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
    await ensureLandlord(context);
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
    return expectOk(
        await context.container.resolve(GetRevisionByIdUseCase).execute(model, revisionId)
    );
};
