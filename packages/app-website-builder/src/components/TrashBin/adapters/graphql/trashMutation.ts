import type { WbError } from "~/types.js";
import gql from "graphql-tag";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";

export interface ITrashPageDeleteMutationVariables {
    id: string;
    permanently: boolean;
}

export interface ITrashPageDeleteMutationResponse {
    websiteBuilder: {
        trashPage: {
            data: PageGatewayDto | null;
            error: WbError | null;
        };
    };
}

export const createTrashPageMutation = (fields: string[]) => {
    return gql`
        mutation WebsiteBuilderTrashPage($id: ID!, $permanently: Boolean!) {
            websiteBuilder {
                trashPage(id: $id, permanently: $permanently) {
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
