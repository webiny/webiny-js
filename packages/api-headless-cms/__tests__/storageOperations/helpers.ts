import shortId from "shortid";
/**
 * Package mdbid does not have types.
 */
// @ts-ignore
import mdbid from "mdbid";
import {
    CmsEntry,
    CmsModel,
    CmsModelField,
    CreatedBy,
    HeadlessCmsStorageOperations
} from "~/types";
import { CmsGroupPlugin } from "~/content/plugins/CmsGroupPlugin";
import { createIdentifier } from "@webiny/utils";
import crypto from "crypto";

const cliPackageJson = require("@webiny/cli/package.json");
const webinyVersion = cliPackageJson.version;

const baseGroup = new CmsGroupPlugin({
    name: "Base group",
    tenant: "root",
    locale: "en-US",
    id: "group",
    slug: "group",
    description: "",
    icon: ""
});

const biography = crypto.randomBytes(65536).toString("hex");

const personModelFields: Record<string, CmsModelField> = {
    name: {
        id: shortId.generate(),
        fieldId: "name",
        label: "Name",
        multipleValues: false,
        type: "text"
    },
    dateOfBirth: {
        id: shortId.generate(),
        fieldId: "dateOfBirth",
        label: "Date Of Birth",
        multipleValues: false,
        type: "datetime",
        settings: {
            type: "date"
        }
    },
    children: {
        id: shortId.generate(),
        fieldId: "children",
        label: "Children",
        multipleValues: false,
        type: "number"
    },
    married: {
        id: shortId.generate(),
        fieldId: "married",
        label: "Married",
        multipleValues: false,
        type: "boolean"
    },
    biography: {
        id: shortId.generate(),
        fieldId: "biography",
        label: "Biography",
        multipleValues: false,
        type: "text"
    }
};

export const createPersonModel = (): CmsModel => {
    return {
        name: "Person Model",
        group: {
            id: baseGroup.contentModelGroup.id,
            name: baseGroup.contentModelGroup.name
        },
        modelId: "personEntriesModel",
        locale: "en-US",
        tenant: "root",
        titleFieldId: personModelFields.name.id,
        fields: Object.values(personModelFields),
        layout: Object.values(personModelFields).map(field => {
            return [field.id];
        }),
        description: "",
        webinyVersion
    };
};

const createdBy: CreatedBy = {
    id: "admin",
    type: "admin",
    displayName: "admin"
};
const ownedBy: CreatedBy = {
    id: "admin",
    type: "admin",
    displayName: "admin"
};

interface CreatePersonEntriesParams {
    amount: number;
    storageOperations: HeadlessCmsStorageOperations;
    maxRevisions?: number;
}

export interface PersonEntriesResult {
    [key: string]: {
        first: CmsEntry;
        revisions: CmsEntry[];
        last: CmsEntry;
    };
}
export const createPersonEntries = async (
    params: CreatePersonEntriesParams
): Promise<PersonEntriesResult> => {
    const { amount, storageOperations, maxRevisions = 1 } = params;
    const personModel = createPersonModel();

    const entries: CmsEntry[] = [];

    for (let i = 1; i <= amount; i++) {
        const entryId = mdbid();
        const id = createIdentifier({
            id: entryId,
            version: 1
        });
        const entry: CmsEntry = {
            id,
            entryId,
            version: 1,
            createdBy,
            ownedBy,
            createdOn: new Date().toISOString(),
            savedOn: new Date().toISOString(),
            modelId: personModel.modelId,
            locale: personModel.locale,
            tenant: personModel.tenant,
            webinyVersion: personModel.webinyVersion,
            locked: false,
            status: "draft",
            values: {
                name: `Person #${i}`,
                biography
            }
        };

        const revisionAmount = (i % maxRevisions) + 1;

        const entryResult = await storageOperations.entries.create(personModel, {
            entry,
            storageEntry: entry
        });

        entries.push(entryResult);

        let nextVersion = entry.version + 1;

        while (nextVersion <= revisionAmount) {
            const id = createIdentifier({
                id: entry.entryId,
                version: nextVersion
            });
            const revision: CmsEntry = {
                id,
                entryId,
                version: nextVersion,
                createdBy,
                ownedBy,
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString(),
                modelId: personModel.modelId,
                locale: personModel.locale,
                tenant: personModel.tenant,
                webinyVersion: personModel.webinyVersion,
                locked: false,
                status: "draft",
                values: {
                    name: `Person #${i}-${nextVersion}`,
                    biography
                }
            };

            const entryRevisionResult = await storageOperations.entries.create(personModel, {
                entry: revision,
                storageEntry: revision
            });
            entries.push(entryRevisionResult);
            /**
             * Need to increase for next version run.
             */
            nextVersion = revision.version + 1;
        }
    }

    const result: PersonEntriesResult = {};
    for (const entry of entries) {
        if (!result[entry.entryId]) {
            result[entry.entryId] = {
                first: entry,
                revisions: [entry],
                last: entry
            };
            continue;
        }
        if (entry.version < result[entry.entryId].first.version) {
            result[entry.entryId].first = entry;
        }
        if (entry.version > result[entry.entryId].last.version) {
            result[entry.entryId].last = entry;
        }
        result[entry.entryId].revisions.push(entry);
    }
    return result;
};

interface DeletePersonModelParams {
    storageOperations: HeadlessCmsStorageOperations;
}
export const deletePersonModel = async (params: DeletePersonModelParams) => {
    const { storageOperations } = params;
    try {
        await storageOperations.models.delete({
            model: createPersonModel()
        });
    } catch (ex) {
        console.log("Trying to delete person model... failed...");
        console.log(ex.message);
        console.log(JSON.stringify(ex));
    }
};
