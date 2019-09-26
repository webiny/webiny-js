// @flow
import * as React from "react";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete";
import gql from "graphql-tag";
import { useAutocomplete } from "@webiny/app/hooks/useAutocomplete";

const LIST_ROLES = gql`
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
`;

export default function RolesAutocomplete(props) {
    const autoComplete = useAutocomplete({
        search: query => ({ query, fields: ["name"] }),
        query: LIST_ROLES
    });
    return <MultiAutoComplete {...props} {...autoComplete} />;
}
