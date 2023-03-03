import gql from "graphql-tag";
import { CmsErrorResponse } from "~/types";
import { CmsReferenceContentEntry } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { CmsEntryGetEntryVariable } from "~/admin/plugins/fieldRenderers/ref/components/graphql";

const fields = `
    data {
        id
        entryId
        title
        description
        image
        status
        createdOn
        savedOn
        model {
            name
            modelId
        }
        createdBy {
            id
            displayName
            type
        }
        modifiedBy {
            id
            displayName
            type
        }
        published {
            id
        }
    }
    error {
        message
        code
        data
    }
`;
export interface ListLatestCmsEntriesResponse {
    entries: {
        data: CmsReferenceContentEntry[];
        error: CmsErrorResponse | null;
    };
}
export interface ListLatestCmsEntriesVariables {
    entries: CmsEntryGetEntryVariable[];
}
export const LIST_LATEST_CONTENT_ENTRIES = gql`
    query CmsListLatestContentEntries($entries: [CmsModelEntryInput!]!) {
        entries: getLatestContentEntries(entries: $entries) {
            ${fields}
        }
    }
`;
