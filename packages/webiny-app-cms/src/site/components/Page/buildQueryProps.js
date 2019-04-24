// @flow
import gql from "graphql-tag";
import { getDataFields, getNotFoundPageFields, getErrorPageFields } from "./graphql";
import type { Location } from "react-router-dom";

type Props = { location: Location, defaultPages: Object };

export default ({ location, defaultPages }: Props) => {
    const query = new URLSearchParams(location.search);
    let defaultPagesFields = ``;
    if (!defaultPages.error) {
        defaultPagesFields += `${getErrorPageFields()}`;
    }

    if (!defaultPages.notFound) {
        defaultPagesFields += `${getNotFoundPageFields()}`;
    }

    // If a preview was requested (from admin):
    if (query.has("preview")) {
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
            variables: { url: location.pathname, id: query.get("preview") }
        };
    }

    if (location.pathname === "/") {
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
        variables: { url: location.pathname }
    };
};
