import { CMS_MODEL_SINGLETON_TAG } from "@webiny/app-headless-cms-common";
import type { CmsModel } from "~/types.js";
import { EntryGraphQLFields as Abstraction } from "./abstractions.js";

const CONTENT_META_FIELDS = /* GraphQL */ `
    title
    description
    image
    version
    locked
    status
`;

const IDENTITY_FIELDS = /* GraphQL */ `
    id
    type
    displayName
`;

class EntryGraphQLFieldsImpl implements Abstraction.Interface {
    getSystemFields(model: CmsModel): string {
        const isSingleton = model.tags.includes(CMS_MODEL_SINGLETON_TAG);

        let optionalFields = "";
        if (!isSingleton) {
            optionalFields = `
                wbyAco_location {
                    folderId
                }
                meta {
                    ${CONTENT_META_FIELDS}
                }
            `;
        }

        return /* GraphQL */ `
            id
            entryId
            createdOn
            savedOn
            modifiedOn
            deletedOn
            firstPublishedOn
            lastPublishedOn
            createdBy { ${IDENTITY_FIELDS} }
            savedBy { ${IDENTITY_FIELDS} }
            modifiedBy { ${IDENTITY_FIELDS} }
            deletedBy { ${IDENTITY_FIELDS} }
            firstPublishedBy { ${IDENTITY_FIELDS} }
            lastPublishedBy { ${IDENTITY_FIELDS} }
            revisionCreatedOn
            revisionSavedOn
            revisionModifiedOn
            revisionDeletedOn
            revisionFirstPublishedOn
            revisionLastPublishedOn
            revisionCreatedBy { ${IDENTITY_FIELDS} }
            revisionSavedBy { ${IDENTITY_FIELDS} }
            revisionModifiedBy { ${IDENTITY_FIELDS} }
            revisionDeletedBy { ${IDENTITY_FIELDS} }
            revisionFirstPublishedBy { ${IDENTITY_FIELDS} }
            revisionLastPublishedBy { ${IDENTITY_FIELDS} }
            ${optionalFields}
            live {
                version
            }
            revisionDescription
        `;
    }

    getValuesBlock(model: CmsModel): string {
        const selection = model.valuesSelection;

        if (!selection || selection === "_empty") {
            return "";
        }

        return `values {\n${selection}\n}`;
    }
}

export const EntryGraphQLFields = Abstraction.createImplementation({
    implementation: EntryGraphQLFieldsImpl,
    dependencies: []
});
