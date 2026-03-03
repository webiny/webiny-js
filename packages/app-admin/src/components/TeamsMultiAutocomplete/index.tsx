import React from "react";
import type { MultiAutoCompleteProps } from "@webiny/ui/AutoComplete/index.js";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete/index.js";
import { LIST_TEAMS, type IListTeamsResponse } from "./graphql.js";
import { useQuery } from "@apollo/client/react";

type TeamsMultiAutocompleteProps = Partial<MultiAutoCompleteProps>;

export const TeamsMultiAutocomplete = (props: TeamsMultiAutocompleteProps) => {
    const { data, loading } = useQuery<IListTeamsResponse>(LIST_TEAMS);

    const options = loading || !data?.security?.teams?.data ? [] : data.security.teams.data;

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
