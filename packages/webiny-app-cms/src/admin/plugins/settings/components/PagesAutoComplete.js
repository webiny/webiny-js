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
    query listPages($parent: String) {
        cms {
            pages: listPages(parent: $parent) {
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
    query listPages($search: String) {
        cms {
            pages: listPages(search: $search) {
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
            const value = get(data, "cms.pages.data.0");
            return (
                <AutoComplete
                    {...props}
                    description={value && !value.published && "Warning: page is not published."}
                    valueProp={"parent"}
                    textProp={"title"}
                    value={value}
                />
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
