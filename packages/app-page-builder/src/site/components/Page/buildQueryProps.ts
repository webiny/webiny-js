import gql from "graphql-tag";
import { getDataFields } from "./graphql";
import { Location } from "history";
import { QueryOptions } from "apollo-client";

type Props = { location: Location; defaultPages?: any };

export default ({ location }: Props): QueryOptions => {
    const query = new URLSearchParams(location.search);

    return {
        query: gql`
                query PbGetPage($id: ID!, $url: String!) {
                    pageBuilder {
                        page: getPage(id: $id) {
                            data ${getDataFields()}
                            error {
                                code
                                message
                            }
                        }
                        getSettings {
                            data {
                                name
                                social {
                                    image {
                                        src
                                    }
                                }
                            }
                        }
                    }
                }
            `,
        variables: { url: location.pathname, id: query.get("preview") }
    };
};
