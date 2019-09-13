// @flow
import * as React from "react";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import gql from "graphql-tag";
import { get } from "lodash";
import { Query } from "react-apollo";
import { useAutocomplete } from "@webiny/app/hooks/useAutocomplete";

// We utilize the same "listPages" GraphQL field.
const GET_PAGE = gql`
    query getPublishedPage($parent: String) {
        pageBuilder {
            page: getPublishedPage(parent: $parent) {
                data {
                    parent
                    published
                    title
                }
            }
        }
    }
`;

const LIST_PUBLISHED_PAGES = gql`
    query listPublishedPages($search: String) {
        pageBuilder {
            pages: listPublishedPages(search: $search) {
                data {
                    parent
                    published
                    title
                }
            }
        }
    }
`;

export function PagesAutocomplete(props) {
    const autoComplete = useAutocomplete(LIST_PUBLISHED_PAGES);

    return (
        <Query skip={!props.value} variables={{ parent: props.value }} query={GET_PAGE}>
            {({ data }) => {
                const value = get(data, "pageBuilder.page.data");
                return (
                    <AutoComplete
                        {...props}
                        {...autoComplete}
                        valueProp={"parent"}
                        textProp={"title"}
                        value={value}
                    />
                );
            }}
        </Query>
    );
}
