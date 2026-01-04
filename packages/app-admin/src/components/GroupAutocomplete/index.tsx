import React from "react";
import type { AutoCompleteProps } from "@webiny/ui/AutoComplete/index.js";
import { AutoComplete } from "@webiny/ui/AutoComplete/index.js";
import { LIST_GROUPS } from "./graphql.js";
import { useQuery } from "@apollo/react-hooks";

type GroupAutocompleteProps = Partial<AutoCompleteProps>;
export const GroupAutocomplete = (props: GroupAutocompleteProps) => {
    const { data, loading } = useQuery(LIST_GROUPS);

    const options = loading || !data ? [] : data.security.groups.data;

    return (
        <AutoComplete
            {...props}
            options={options}
            valueProp={"id"}
            value={loading ? undefined : props.value}
        />
    );
};
