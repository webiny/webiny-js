import React from "react";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete";

interface UsersTeamsMultiAutocompleteProps {
    options: any;
    value: any;
    onChange: (value: any) => void;
}

export const UsersTeamsMultiAutocomplete = (props: UsersTeamsMultiAutocompleteProps) => {
    return (
        <>
            {/* A hack that ensures the autocomplete is not being auto-focused. */}
            <input style={{ position: "fixed", left: 10000 }} type="text" />
            <MultiAutoComplete
                label={"Add user or a team"}
                renderMultipleSelection={null}
                options={props.options}
                valueProp={"target"}
                unique={false}
                onChange={props.onChange}
                value={props.value || []}
            />
        </>
    );
};
