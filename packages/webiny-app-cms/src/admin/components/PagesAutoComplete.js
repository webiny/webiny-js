// @flow
import * as React from "react";
import { AutoComplete } from "webiny-ui/AutoComplete";
import { withAutoComplete } from "webiny-app/components";
import { compose } from "recompose";
import gql from "graphql-tag";
import { get } from "lodash";
import { Query } from "react-apollo";

// We utilize the same "listPages" GraphQL field.
const getPage = gql`
    query getPublishedPage($parent: String) {
        cms {
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
        cms {
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

const PagesAutoComplete = props => (
    <Query skip={!props.value} variables={{ parent: props.value }} query={getPage}>
        {({ data }) => {
            const value = get(data, "cms.page.data");
            return (
                <AutoComplete {...props} valueProp={"parent"} textProp={"title"} value={value} />
            );
        }}
    </Query>
);

export default compose(
    withAutoComplete({
        response: data => get(data, "cms.pages"),
        query: listPages
    })
)(PagesAutoComplete);
