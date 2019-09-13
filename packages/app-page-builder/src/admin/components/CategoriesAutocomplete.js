// @flow
import * as React from "react";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import gql from "graphql-tag";
import { get } from "lodash";
import { Query } from "react-apollo";
import { useAutocomplete } from "@webiny/app/hooks/useAutocomplete";

const GET_CATEGORY = gql`
    query getCategory($id: ID!) {
        pageBuilder {
            getCategory(id: $id) {
                data {
                    id
                    name
                }
            }
        }
    }
`;

const LIST_CATEGORIES = gql`
    query listCategories($search: PbSearchInput) {
        pageBuilder {
            categories: listCategories(search: $search) {
                data {
                    id
                    name
                }
            }
        }
    }
`;

export function CategoriesAutocomplete(props) {
    const autoComplete = useAutocomplete({
        search: query => ({ query, fields: ["name"] }),
        query: LIST_CATEGORIES
    });

    return (
        <Query skip={!props.value} variables={{ id: props.value }} query={GET_CATEGORY}>
            {({ data }) => (
                <AutoComplete {...props} {...autoComplete} value={get(data, "pageBuilder.getCategory.data")}/>
            )}
        </Query>
    );
}
