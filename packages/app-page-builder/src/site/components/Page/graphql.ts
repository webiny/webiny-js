import gql from "graphql-tag";
import { getPlugins } from "@webiny/plugins";
import { PbPageSettingsFieldsPlugin } from "@webiny/app-page-builder/types";

export const GET_PUBLISHED_PAGE = () => {
    const pageSettingsFields = getPlugins("pb-page-settings-fields")
        .map((pl: PbPageSettingsFieldsPlugin) => pl.fields)
        .join("\n");

    return gql`
        query PbGetPage($id: ID!, $url: String!) {
            pageBuilder {
                page: getPage(id: $id) {
                    data {
                        id
                        title
                        url
                        version
                        publishedOn
                        snippet
                        content
                        createdBy {
                            firstName
                            lastName
                        }
                        settings {
                            _empty
                            ${pageSettingsFields}
                        }
                        category {
                            id
                            name
                        }
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
