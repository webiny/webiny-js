// @flow
import * as React from "react";
import { AutoComplete } from "webiny-ui/AutoComplete";
import { withAutoComplete } from "webiny-app/components";
import { compose } from "recompose";
import gql from "graphql-tag";
import { get } from "lodash";

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

const PagesAutoComplete = props => <AutoComplete {...props} textProp={"title"} />;

export default compose(
    withAutoComplete({
        response: data => get(data, "cms.pages"),
        query: loadPages
    })
)(PagesAutoComplete);
