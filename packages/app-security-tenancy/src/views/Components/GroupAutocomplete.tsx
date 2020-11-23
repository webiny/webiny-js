import * as React from "react";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import gql from "graphql-tag";
import { useAutocomplete } from "@webiny/app/hooks/useAutocomplete";
// TODO: currently "search" doesn't work
const LIST_GROUPS = gql`
    query listGroups($where: ListSecurityGroupWhereInput) {
        security {
            groups: listGroups(where: $where) {
                data {
                    id
                    name
                }
            }
        }
    }
`;

export default function GroupAutocomplete(props) {
    const autoComplete = useAutocomplete({
        search: query => ({ query, fields: ["name"] }),
        query: LIST_GROUPS
    });
    return <AutoComplete {...props} {...autoComplete} />;
}
