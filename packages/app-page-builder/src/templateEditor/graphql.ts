import gql from "graphql-tag";
import { PbErrorResponse, PbPageTemplate } from "~/types";

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

const DATA_FIELD = `
    {
        id
        title
        slug
        tags
        layout
        description
        content
        createdOn
        savedOn
        createdBy {
            id
            displayName
            type
        }
    }
`;

/**
 * #####################
 * Get Page Template Query Response
 */
export interface GetPageTemplateQueryResponse {
    pageBuilder: {
        getPageTemplate: {
            data: PbPageTemplate | null;
            error: PbErrorResponse | null;
        };
    };
}
export interface GetPageTemplateQueryVariables {
    id: string;
}
export const GET_PAGE_TEMPLATE = gql`
    query PbGetPageTemplate($id: ID!) {
        pageBuilder {
            getPageTemplate(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
