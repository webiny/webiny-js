// @flow
import * as React from "react";
import { AutoComplete } from "webiny-ui/AutoComplete";
import { withAutoComplete } from "webiny-app/components";
import { compose } from "recompose";
import gql from "graphql-tag";
import { get } from "lodash";
import { Query } from "react-apollo";

const loadCategory = gql`
    query LoadCategory($id: ID!) {
        cms {
            pageBuilder {
                getCategory(id: $id) {
                    data {
                        id
                        name
                    }
                }
            }
        }
    }
`;

const listCategories = gql`
    query LoadCategories($search: SearchInput) {
        cms {
            pageBuilder {
                categories: listCategories(search: $search) {
                    data {
                        id
                        name
                    }
                }
            }
        }
    }
`;

const CategoriesAutoComplete = props => (
    <Query skip={!props.value} variables={{ id: props.value }} query={loadCategory}>
        {({ data }) => (
            <AutoComplete {...props} value={get(data, "cms.pageBuilder.getCategory.data")} />
        )}
    </Query>
);

export default compose(
    withAutoComplete({
        response: data => get(data, "cms.pageBuilder.categories"),
        search: query => ({ query, fields: ["name"] }),
        query: listCategories
    })
)(CategoriesAutoComplete);
