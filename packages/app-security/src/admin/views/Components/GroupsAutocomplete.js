// @flow
import * as React from "react";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete";
import gql from "graphql-tag";
import { useAutocomplete } from "@webiny/app/hooks/useAutocomplete";

const LIST_GROUPS = gql`
    query listGroups($search: SecurityGroupSearchInput) {
        security {
            groups: listGroups(search: $search) {
                data {
                    id
                    name
                }
            }
        }
    }
`;

export default function GroupsAutocomplete(props) {
    const autoComplete = useAutocomplete({
        search: query => ({ query, fields: ["name"] }),
        query: LIST_GROUPS
    });
    return <MultiAutoComplete {...props} {...autoComplete} />;
}
