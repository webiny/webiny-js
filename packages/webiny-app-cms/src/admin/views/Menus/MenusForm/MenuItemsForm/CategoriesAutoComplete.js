// @flow
import * as React from "react";
import { AutoComplete } from "webiny-ui/AutoComplete";
import { withAutoComplete } from "webiny-app/components";
import { compose } from "recompose";
import gql from "graphql-tag";
import { get } from "lodash";

const CategoriesAutoComplete = props => <AutoComplete {...props} textProp={"title"} />;

export default compose(
    withAutoComplete({
        response: data => get(data, "cms.categories"),
        variables: search => ({ search }),
        query: gql`
            query LoadCategories($search: String) {
                cms {
                    categories: listCategories(search: $search) {
                        data {
                            id
                            title
                        }
                    }
                }
            }
        `
    })
)(CategoriesAutoComplete);
