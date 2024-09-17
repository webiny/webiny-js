import React from "react";
import { MultiAutoComplete, MultiAutoCompleteProps } from "@webiny/ui/AutoComplete";
import { LIST_TEAMS } from "./graphql";
import { useQuery } from "@apollo/react-hooks";

type TeamsMultiAutocompleteProps = Partial<MultiAutoCompleteProps>;

export const TeamsMultiAutocomplete = (props: TeamsMultiAutocompleteProps) => {
    const { data, loading } = useQuery(LIST_TEAMS);

    const options = loading || !data ? [] : data.security.teams.data;

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
