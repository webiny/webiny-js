import gql from "graphql-tag";
import { CmsErrorResponse } from "@webiny/app-headless-cms/types";

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export interface GetPageQueryResponse {
    data: {
        runQuery: {
            data: {
                data: any;
                error: CmsErrorResponse | null;
            };
        };
    };
}

export interface RunQueryVariables {
    query: string;
}

export const RUN_QUERY = gql`
    query RunQuery($query: String!) {
        runQuery(query: $query) {
            data
            error ${ERROR_FIELD}
        }
    }
`;
