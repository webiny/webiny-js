import gql from "graphql-tag";
import type { WbError } from "~/types.js";

export interface IBulkActionsMutationVariables {
    action: string;
}

export interface IBulkActionsMutationResponse {
    websiteBuilder: {
        bulkActions: {
            data: {
                id: string;
            } | null;
            error: WbError | null;
        };
    };
}

export const createBulkActionsMutation = (fields: string[]) => {
    return gql`
        mutation WebsiteBuilderBulkActions($action: WbBulkActionsInput!) {
            websiteBuilder {
                bulkActions(action: $action) {
                    data {
                        ${fields.join("\n")}
                    }
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;
};
