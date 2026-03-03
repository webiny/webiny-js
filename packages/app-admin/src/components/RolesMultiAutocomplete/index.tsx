import React from "react";
import type { MultiAutoCompleteProps } from "@webiny/ui/AutoComplete/index.js";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete/index.js";
import { type IListRolesResponse, LIST_ROLES } from "./graphql.js";
import { useQuery } from "@apollo/client/react";

type RolesMultiAutocompleteProps = Partial<MultiAutoCompleteProps>;

export const RolesMultiAutocomplete = (props: RolesMultiAutocompleteProps) => {
    const { data, loading } = useQuery<IListRolesResponse>(LIST_ROLES);

    const options = loading || !data ? [] : data.security.roles.data;

    return (
        <MultiAutoComplete
            {...props}
            options={options}
            valueProp={"id"}
            unique={true}
            value={loading ? undefined : props.value}
        />
    );
};
