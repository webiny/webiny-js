import React from "react";
import type { AutoCompleteProps } from "@webiny/ui/AutoComplete/index.js";
import { AutoComplete } from "@webiny/ui/AutoComplete/index.js";
import { LIST_TEAMS } from "./graphql.js";
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
