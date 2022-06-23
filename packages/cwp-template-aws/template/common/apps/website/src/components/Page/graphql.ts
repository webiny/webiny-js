import gql from "graphql-tag";
import { plugins } from "@webiny/plugins";
import {
    PbPageSettingsFieldsPlugin,
    PbPageData,
    PbErrorResponse
} from "@webiny/app-page-builder/types";

/**
 * We get all the `PbPageSettingsFieldsPlugin` plugins, which contain different page-settings-related GraphQL fields.
 * You can check out the default plugins, that come from the `app-page-builder` package, on the following link:
 * https://github.com/webiny/webiny-js/blob/master/packages/app-page-builder/src/render/plugins/pageSettings/index.ts
 */
export interface PublishedPageQueryResponse {
    pageBuilder: {
        getPublishedPage: {
            data: PbPageData;
            error: PbErrorResponse | null;
        };
    };
}
export interface PublishedPageQueryVariables {
    id: string | null;
    path: string | null;
    returnNotFoundPage: boolean;
    preview: boolean;
}
export const GET_PUBLISHED_PAGE = () => {
    const pageSettingsFields = plugins
        .byType<PbPageSettingsFieldsPlugin>("pb-page-settings-fields")
        .map(pl => pl.fields)
        .join("\n");

    return gql`
        query PbGetPublishedPage($id: ID, $path: String, $returnNotFoundPage: Boolean, $preview: Boolean) {
            pageBuilder {
                getPublishedPage(id: $id, path: $path, returnNotFoundPage: $returnNotFoundPage, preview: $preview) {
                    data {
                        id
                        title
                        url
                        version
                        publishedOn
                        content
                        createdBy {
                            displayName
                        }
                        settings {
                            ${pageSettingsFields}
                        }
                    }
                    error {
                        code
                        message
                        data
                    }
                }
            }
        }
    `;
};

export interface SettingsQueryResponseData {
    name: string;
    social: {
        facebook: string;
        instagram: string;
        twitter: string;
        image: {
            src: string;
        };
    };
    logo: {
        src: string;
    };
    favicon: {
        src: string;
    };
}
export interface SettingsQueryResponse {
    pageBuilder: {
        getSettings: {
            data: SettingsQueryResponseData;
            error: PbErrorResponse | null;
        };
    };
}
export const GET_SETTINGS = gql`
    query PbGetSettings {
        pageBuilder {
            getSettings {
                data {
                    name
                    social {
                        facebook
                        instagram
                        twitter
                        image {
                            src
                        }
                    }
                    logo {
                        src
                    }
                    favicon {
                        src
                    }
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;
