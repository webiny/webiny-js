// @flow
import gql from "graphql-tag";
import { getDataFields, getNotFoundPageFields, getErrorPageFields } from "./graphql";

type Props = { url: string, defaultPages: Object };

export default ({ url, defaultPages }: Props) => {
    let defaultPagesFields = ``;
    if (!defaultPages.error) {
        defaultPagesFields += `${getErrorPageFields()}`;
    }

    if (!defaultPages.notFound) {
        defaultPagesFields += `${getNotFoundPageFields()}`;
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
