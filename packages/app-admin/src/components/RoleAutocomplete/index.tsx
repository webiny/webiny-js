import React from "react";
import type { AutoCompleteProps } from "@webiny/ui/AutoComplete/index.js";
import { AutoComplete } from "@webiny/ui/AutoComplete/index.js";
import { LIST_ROLES } from "./graphql.js";
import { useQuery } from "@apollo/react-hooks";

type RoleAutocompleteProps = Partial<AutoCompleteProps>;
export const RoleAutocomplete = (props: RoleAutocompleteProps) => {
    const { data, loading } = useQuery(LIST_ROLES);

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
