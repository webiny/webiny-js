import React from "react";
import type { AutoCompleteProps } from "@webiny/ui/AutoComplete/index.js";
import { AutoComplete } from "@webiny/ui/AutoComplete/index.js";
import { type IListRolesResponse, LIST_ROLES } from "./graphql.js";
import { useQuery } from "@apollo/client/react";

type RoleAutocompleteProps = Partial<AutoCompleteProps>;
export const RoleAutocomplete = (props: RoleAutocompleteProps) => {
    const { data, loading } = useQuery<IListRolesResponse>(LIST_ROLES);

    const options = loading || !data ? [] : data.security.roles.data;

    return (
        <AutoComplete
            {...props}
            options={options}
            valueProp={"id"}
            value={loading ? undefined : props.value}
        />
    );
};
