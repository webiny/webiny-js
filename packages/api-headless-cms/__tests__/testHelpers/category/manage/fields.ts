import { IDENTITY_FIELDS } from "~tests/testHelpers/fields/index.js";

export const categoryFields = /* GraphQL */ `
    {
        id
        entryId
        createdOn
        modifiedOn
        savedOn
        firstPublishedOn
        lastPublishedOn
        deletedOn
        restoredOn
        createdBy ${IDENTITY_FIELDS}
        modifiedBy ${IDENTITY_FIELDS}
        savedBy ${IDENTITY_FIELDS}
        deletedBy ${IDENTITY_FIELDS}
        restoredBy ${IDENTITY_FIELDS}
        meta {
            title
            modelId
            version
            locked
            status

            revisions {
                id
                values {
                    title
                    slug
                    separator
                }
                meta {
                    status
                    version
                }
            }
            data
        }
        wbyAco_location {
            folderId
        }
        # user defined fields
        values {
            title
            slug
            separator
        }
    }
`;
