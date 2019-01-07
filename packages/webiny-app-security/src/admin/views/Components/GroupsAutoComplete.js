// @flow
import * as React from "react";
import { MultiAutoComplete } from "webiny-ui/AutoComplete";
import { withAutoComplete } from "webiny-app/components";
import { compose } from "recompose";
import gql from "graphql-tag";
import { get } from "lodash";

const GroupsAutoComplete = props => <MultiAutoComplete {...props} />;

export default compose(
    withAutoComplete({
        response: data => get(data, "security.groups"),
        variables: query => ({ query, fields: ["name"] }),
        query: gql`
            query LoadGroups($search: SearchInput) {
                security {
                    groups: listGroups(search: $search) {
                        data {
                            id
                            name
                        }
                    }
                }
            }
        `
    })
)(GroupsAutoComplete);
