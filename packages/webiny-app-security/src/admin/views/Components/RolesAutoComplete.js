// @flow
import * as React from "react";
import { MultiAutoComplete } from "webiny-ui/AutoComplete";
import { withAutoComplete } from "webiny-app/components";
import gql from "graphql-tag";
import { get } from "lodash";

const RolesAutoComplete = props => <MultiAutoComplete {...props} />;

export default withAutoComplete({
    response: data => get(data, "security.roles"),
    search: query => ({ query, fields: ["name"] }),
    query: gql`
        query LoadRoles($search: SecurityRoleSearchInput) {
            security {
                roles: listRoles(search: $search) {
                    data {
                        id
                        name
                    }
                }
            }
        }
    `
})(RolesAutoComplete);
