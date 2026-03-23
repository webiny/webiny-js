import type { WbError } from "~/types.js";
import gql from "graphql-tag";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";

export interface IPermanentDeletePageMutationVariables {
    id: string;
    permanently: boolean;
}

export interface IPermanentDeletePageMutationResponse {
    websiteBuilder: {
        deletePage: {
            data: PageGatewayDto | null;
            error: WbError | null;
        };
    };
}

export const createPermanentDeletePageMutation = () => {
    return gql`
        mutation WebsiteBuilderPermanentlyDeletePage($id: ID!, $permanently: Boolean!) {
            websiteBuilder {
                deletePage(id: $id, permanently: $permanently) {
                    data
                    error {
                        code
                        message
                    }
                }
            }
        }
    `;
};
