// @flow
import * as React from "react";
import { AutoComplete } from "webiny-ui/AutoComplete";
import { withAutoComplete } from "webiny-app/components";
import { compose } from "recompose";
import gql from "graphql-tag";
import { get } from "lodash";
import { Query } from "react-apollo";

const loadPage = gql`
    query LoadPage($id: ID!) {
        cms {
            getPage(id: $id) {
                data {
                    id
                    title
                }
            }
        }
    }
`;

const loadPages = gql`
    query LoadPages($search: String) {
        cms {
            pages: listPages(search: $search) {
                data {
                    id
                    title
                }
            }
        }
    }
`;

const PagesAutoComplete = props => (
    <Query skip={!props.value} variables={{ id: props.value }} query={loadPage}>
        {({ data }) => (
            <AutoComplete {...props} textProp={"title"} value={get(data, "cms.getPage.data")} />
        )}
    </Query>
);

export default compose(
    withAutoComplete({
        response: data => get(data, "cms.pages"),
        query: loadPages
    })
)(PagesAutoComplete);
