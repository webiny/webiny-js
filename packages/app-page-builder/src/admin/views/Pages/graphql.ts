import gql from "graphql-tag";
import { plugins } from "@webiny/plugins";
import { PbEditorPageQueryFieldsPlugin } from "~/types";

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

const DATA_FIELD = () => {
    return /* GraphQL */ `
    {
        id
        pid
        title
        path
        version
        locked
        status
        category {
            url
            name
            slug
        }
        revisions {
            id
            title
            status
            locked
            version
            savedOn
        }
        createdBy {
            id
        }
        content
        savedOn
        ${plugins
            .byType<PbEditorPageQueryFieldsPlugin>("pb-editor-page-query-fields")
            .map(pl => pl.fields)
            .join("\n")}
    }
`;
};

export const CREATE_PAGE_FROM = () => gql`
    mutation CreatePageFrom($from: ID) {
        pageBuilder {
            createPage(from: $from) {
                data ${DATA_FIELD()}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_PAGE = () => gql`
    query GetPage($id: ID!) {
        pageBuilder {
            getPage(id: $id) {
                data ${DATA_FIELD()}
                error ${ERROR_FIELD}
            }
        }
    }
`;
