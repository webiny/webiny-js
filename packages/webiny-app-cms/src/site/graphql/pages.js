// @flow
import gql from "graphql-tag";
import { getPlugins } from "webiny-plugins";
import type { CmsPageSettingsFieldsPluginType } from "webiny-app-cms/types";

const getSettingsFields = () => {
    return getPlugins("cms-page-settings-fields")
        .map((pl: CmsPageSettingsFieldsPluginType) => pl.fields)
        .join("\n");
};

const getDataFields = () => {
    return /* GraphQL */ `
        {
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
                ${getSettingsFields()}
            }
            category {
                id
                name
            }
        }
    `;
};

export const getPage = () => {
    return gql`
        query CmsGetPage($url: String!) {
            cms {
                page: getPublishedPage(url: $url) {
                    data ${getDataFields()}
                    error {
                        code
                        message
                    }
                }
            }
        }
    `;
};

export const listPages = () => {
    return gql`
        query CmsListPages(
            $category: String
            $tags: [String]
            $tagsRule: TagsRule
            $sort: PageSortInput
            $page: Int
            $perPage: Int
        ) {
            cms {
                pages: listPublishedPages(
                    category: $category
                    page: $page
                    perPage: $perPage
                    sort: $sort
                    tags: $tags
                    tagsRule: $tagsRule
                ) {
                    data ${getDataFields()}
                    error {
                        code
                        message
                    }
                }
            }
        }
    `;
};

export const getHomePage = gql`
    query getHomePage {
        cms {
            page: getHomePage {
                data ${getDataFields()}            
            }
        }
    }
`;

export const getNotFoundPage = gql`
    query getNotFoundPage {
        cms {
            page: getNotFoundPage {
                data ${getDataFields()}            
            }
        }
    }
`;

export const getErrorPage = gql`
    query getErrorPage {
        cms {
            page: getErrorPage {
                data ${getDataFields()}            
            }
        }
    }
`;
