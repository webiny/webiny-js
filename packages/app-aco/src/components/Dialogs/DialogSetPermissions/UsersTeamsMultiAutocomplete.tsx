import React from "react";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete";

interface UsersTeamsMultiAutocompleteProps {
    options: any;
    value: any;
    onChange: (value: any) => void;
}

export const UsersTeamsMultiAutocomplete: React.FC<UsersTeamsMultiAutocompleteProps> = props => {
    return (
        <MultiAutoComplete
            label={"Add user or a team"}
            renderMultipleSelection={null}
            options={props.options}
            valueProp={"target"}
            unique={true}
            onChange={props.onChange}
            value={props.value || []}
        />
    );
};
