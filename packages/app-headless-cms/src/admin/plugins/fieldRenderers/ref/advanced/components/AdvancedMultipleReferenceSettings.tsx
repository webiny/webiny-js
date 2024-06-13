import { Bind } from "@webiny/form";
import React from "react";
import { Select } from "@webiny/ui/Select";
import { Cell } from "@webiny/ui/Grid";

export interface MultiRefFieldSettings {
    newItemPosition: "first" | "last";
}

export const AdvancedMultipleReferenceSettings = () => {
    return (
        <>
            <Cell span={12}>
                <Bind name={"renderer.settings.newItemPosition"} defaultValue={"last"}>
                    <Select
                        label={"New item position"}
                        description={"Where should the new items be added?"}
                    >
                        <option value={"first"}>Top of the list</option>
                        <option value={"last"}>Bottom of the list</option>
                    </Select>
                </Bind>
            </Cell>
        </>
    );
};
