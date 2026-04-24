import type { WbError } from "~/types.js";
import gql from "graphql-tag";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";

export interface ITrashPageRestoreMutationVariables {
    id: string;
}

export interface ITrashPageRestoreMutationResponse {
    websiteBuilder: {
        restorePage: {
            data: PageGatewayDto | null;
            error: WbError | null;
        };
    };
}

export const createRestorePageMutation = (fields: string[]) => {
    return gql`
        mutation WebsiteBuilderRestorePage($id: ID!) {
            websiteBuilder {
                restorePage(id: $id) {
                    data {
                        ${fields.join("\n")}
                    }
                    error {
                        code
                        message
                    }
                }
            }
        }
    `;
};
