import gql from "graphql-tag";
import { plugins } from "@webiny/plugins";
import { PbEditorPageSettingsPlugin } from "@webiny/app-page-builder/types";

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

const DATA_FIELD = () => /* GraphQL */ `
    {
        id
        pid
        title
        path
        dynamic
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
        settings {
            _empty
            ${plugins
                .byType("pb-editor-page-settings")
                .map((pl: PbEditorPageSettingsPlugin) => pl.fields)
                .join("\n")}
        }
        createdBy {
            id
        }
        content
        savedOn
    }
`;

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
