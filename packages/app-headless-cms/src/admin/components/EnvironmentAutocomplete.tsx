import React from "react";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";

export default function EnvironmentAutocomplete(props) {
    const {
        environments: { environments }
    } = useCms();

    const options = environments === 0 ? [] : environments;

    return (
        <AutoComplete
            {...props}
            options={options}
            value={options.length === 0 ? null : props.value}
        />
    );
}
