import * as React from "react";
import { Select as UiSelect } from "@webiny/ui/Select";

const Select = props => {
    return (
        <UiSelect {...props}>
            {props.options.map(t => {
                return (
                    <option key={t.value} value={t.value}>
                        {t.label}
                    </option>
                );
            })}
        </UiSelect>
    );
};

export default Select;
