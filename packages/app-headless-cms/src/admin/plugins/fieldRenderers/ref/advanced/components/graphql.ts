import gql from "graphql-tag";
import { CmsErrorResponse } from "~/types";
import { CmsReferenceContentEntry } from "~/admin/plugins/fieldRenderers/ref/components/types";

export interface CmsGetSelectedEntryVariables {
    entry: {
        id: string;
        modelId: string;
    };
}
export interface CmsGetSelectedEntryResponse {
    entry: {
        data: CmsReferenceContentEntry | null;
        error: CmsErrorResponse | null;
    };
}
export const GET_SELECTED_CONTENT_ENTRY = gql`
    query CmsGetSelectedContentEntry($entry: CmsModelEntryInput!) {
        entry: getLatestContentEntry(entry: $entry) {
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
        }
    }
`;
