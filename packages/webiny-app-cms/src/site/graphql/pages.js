// @flow
import gql from "graphql-tag";
import { getPlugins } from "webiny-plugins";
import type { CmsPageSettingsFieldsPluginType } from "webiny-app-cms/types";

const getSettingsFields = () => {
    return getPlugins("cms-page-settings-fields")
        .map((pl: CmsPageSettingsFieldsPluginType) => pl.fields)
        .join("\n");
};

export const getPage = () => {
    const plugins = getSettingsFields();

    return gql`
        query CmsGetPage($url: String!) {
            cms {
                page: getPublishedPage(url: $url) {
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
                            ${plugins}
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

export const listPages = () => {
    const plugins = getSettingsFields();

    return gql`
        query CmsListPages($category: String, $tags: [String], $tagsRule: TagsRule, $sort: PageSortInput, $page: Int, $perPage: Int) {
            cms {
                pages: listPublishedPages(category: $category, page: $page, perPage: $perPage, sort: $sort, tags: $tags, tagsRule: $tagsRule) {
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
                            ${plugins}
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
