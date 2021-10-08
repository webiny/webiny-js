import React from "react";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import { LIST_GROUPS } from "../Groups/graphql";
import { useQuery } from "@apollo/react-hooks";

export default function GroupAutocomplete(props) {
    const { data, loading } = useQuery(LIST_GROUPS);

    const options = loading && !data ? [] : data.security.groups.data;

    return (
        <AutoComplete
            {...props}
            options={options}
            valueProp={"slug"}
            value={loading ? null : props.value}
        />
    );
}
