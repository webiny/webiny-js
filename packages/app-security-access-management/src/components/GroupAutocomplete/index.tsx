import React from "react";
import { AutoComplete, Props as AutocompleteProps } from "@webiny/ui/AutoComplete";
import { LIST_GROUPS } from "./graphql";
import { useQuery } from "@apollo/react-hooks";

interface GroupAutocompleteProps extends AutocompleteProps {}
export const GroupAutocomplete: React.FC<GroupAutocompleteProps> = props => {
    const { data, loading } = useQuery(LIST_GROUPS);

    const options = loading && !data ? [] : data.security.groups.data;

    return (
        <AutoComplete
            {...props}
            options={options}
            valueProp={"id"}
            value={loading ? null : props.value}
        />
    );
};
