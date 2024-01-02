import React from "react";
import { AutoComplete, AutoCompleteProps } from "@webiny/ui/AutoComplete";
import { LIST_TEAMS } from "./graphql";
import { useQuery } from "@apollo/react-hooks";

type TeamAutocompleteProps = Partial<AutoCompleteProps>;
export const TeamAutocomplete = (props: TeamAutocompleteProps) => {
    const { data, loading } = useQuery(LIST_TEAMS);

    const options = loading || !data ? [] : data.security.teams.data;

    return (
        <AutoComplete
            {...props}
            options={options}
            valueProp={"id"}
            value={loading ? undefined : props.value}
        />
    );
};
