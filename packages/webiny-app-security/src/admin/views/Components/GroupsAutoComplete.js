// @flow
import * as React from "react";
import { MultiAutoComplete } from "webiny-ui/AutoComplete";
import { withAutoComplete } from "webiny-app/components";
import gql from "graphql-tag";
import { get } from "lodash";

const GroupsAutoComplete = props => <MultiAutoComplete {...props} />;

export default withAutoComplete({
    response: data => get(data, "security.groups"),
    search: query => ({ query, fields: ["name"] }),
    query: gql`
        query LoadGroups($search: SecurityGroupSearchInput) {
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
})(GroupsAutoComplete);
