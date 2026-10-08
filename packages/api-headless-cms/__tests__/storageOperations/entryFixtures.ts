import type { CmsEntry, CmsEntryStatus, CmsEntryValues, CmsIdentity, CmsModel } from "~/types";
import { createIdentifier } from "@webiny/utils";

const identity: CmsIdentity = {
    id: "admin",
    type: "admin",
    displayName: "admin"
};

export interface CreateTestEntryParams {
    model: CmsModel;
    entryId: string;
    version: number;
    status: CmsEntryStatus;
    values: CmsEntryValues;
}

/**
 * A complete `CmsEntry`, with every required meta field set, for direct storage operation calls.
 */
export const createTestEntry = (params: CreateTestEntryParams): CmsEntry => {
    const { model, entryId, version, status, values } = params;
    const now = new Date().toISOString();
    return {
        id: createIdentifier({ id: entryId, version }),
        entryId,
        tenant: model.tenant,
        modelId: model.modelId,
        version,
        locked: false,
        status,
        values,
        createdOn: now,
        savedOn: now,
        modifiedOn: null,
        deletedOn: null,
        restoredOn: null,
        firstPublishedOn: null,
        lastPublishedOn: null,
        createdBy: identity,
        savedBy: identity,
        modifiedBy: null,
        deletedBy: null,
        restoredBy: null,
        firstPublishedBy: null,
        lastPublishedBy: null,
        revisionCreatedOn: now,
        revisionSavedOn: now,
        revisionModifiedOn: null,
        revisionDeletedOn: null,
        revisionRestoredOn: null,
        revisionFirstPublishedOn: null,
        revisionLastPublishedOn: null,
        revisionCreatedBy: identity,
        revisionSavedBy: identity,
        revisionModifiedBy: null,
        revisionDeletedBy: null,
        revisionRestoredBy: null,
        revisionFirstPublishedBy: null,
        revisionLastPublishedBy: null,
        live: null,
        revisionDescription: undefined,
        expiresAt: null
    };
};
