// @flow
import * as React from "react";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import { withAutoComplete } from "@webiny/app/components";
import gql from "graphql-tag";
import { get } from "lodash";
import { Query } from "react-apollo";

// We utilize the same "listPages" GraphQL field.
const getPage = gql`
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

const listPages = gql`
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

export const PagesAutoComplete = withAutoComplete({
    response: data => get(data, "pageBuilder.pages"),
    query: listPages
})(props => (
    <Query skip={!props.value} variables={{ parent: props.value }} query={getPage}>
        {({ data }) => {
            const value = get(data, "pageBuilder.page.data");
            return (
                <AutoComplete {...props} valueProp={"parent"} textProp={"title"} value={value} />
            );
        }}
    </Query>
));
