import React from "react";
import { AutoComplete, AutoCompleteProps } from "@webiny/ui/AutoComplete";
import { LIST_GROUPS } from "./graphql";
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
