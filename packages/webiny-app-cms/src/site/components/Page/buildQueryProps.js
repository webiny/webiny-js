// @flow
import gql from "graphql-tag";
import { getDataFields, getNotFoundPageFields, getErrorPageFields } from "./graphql";

type Props = { url: string, query: Object, defaultPages: Object };

export default ({ url, query, defaultPages }: Props) => {
    let defaultPagesFields = ``;
    if (!defaultPages.error) {
        defaultPagesFields += `${getErrorPageFields()}`;
    }

    if (!defaultPages.notFound) {
        defaultPagesFields += `${getNotFoundPageFields()}`;
    }

    // If a preview was requested (from admin):
    if (query.preview) {
        return {
            query: gql`
                query CmsGetPage($id: ID!) {
                    cms {
                        page: getPage(id: $id) {
                            data ${getDataFields()}
                            error {
                                code
                                message
                            }
                        }
                        ${defaultPagesFields}
                    }
                }
            `,
            variables: { url, id: query.preview }
        };
    }

    if (url === "/") {
        return {
            query: gql`
                query getHomePage {
                    cms {
                        page: getHomePage {
                            data ${getDataFields()}
                            error {
                                code
                                message
                            }
                        }
                        ${defaultPagesFields}
                    }
                }
            `
        };
    }

    return {
        query: gql`
                query CmsGetPage($url: String!) {
                    cms {
                        page: getPublishedPage(url: $url) {
                            data ${getDataFields()}
                            error {
                                code
                                message
                            }
                        }
                        ${defaultPagesFields}
                    }
                }
            `,
        variables: { url }
    };
};
