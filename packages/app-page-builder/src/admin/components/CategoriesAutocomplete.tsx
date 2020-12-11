import * as React from "react";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import gql from "graphql-tag";
import { get } from "lodash";
import { Query } from "react-apollo";
import { useAutocomplete } from "@webiny/app/hooks/useAutocomplete";

const GET_CATEGORY = gql`
    query GetCategory($slug: String!) {
        pageBuilder {
            getCategory(slug: $slug) {
                data {
                    slug
                    name
                }
            }
        }
    }
`;

const LIST_CATEGORIES = gql`
    query ListCategories {
        pageBuilder {
            categories: listCategories {
                data {
                    slug
                    name
                }
            }
        }
    }
`;

export function CategoriesAutocomplete(props) {
    const autoComplete = useAutocomplete({
        query: LIST_CATEGORIES
    });

    return (
        <Query skip={!props.value} variables={{ slug: props.value }} query={GET_CATEGORY}>
            {({ data }) => (
                <AutoComplete
                    {...props}
                    {...autoComplete}
                    valueProp={"slug"}
                    value={get(data, "pageBuilder.getCategory.data")}
                />
            )}
        </Query>
    );
}
