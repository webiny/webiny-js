import React from "react";
import type { MultiAutoCompleteProps } from "@webiny/ui/AutoComplete/index.js";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete/index.js";
import { LIST_GROUPS } from "./graphql.js";
import { useQuery } from "@apollo/react-hooks";

type GroupsMultiAutocompleteProps = Partial<MultiAutoCompleteProps>;

export const GroupsMultiAutocomplete = (props: GroupsMultiAutocompleteProps) => {
    const { data, loading } = useQuery(LIST_GROUPS);

    const options = loading || !data ? [] : data.security.groups.data;

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
