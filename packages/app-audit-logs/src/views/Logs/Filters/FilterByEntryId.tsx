import React from "react";
import {useBind, useForm} from "@webiny/form";
import {Input} from "@webiny/ui/Input";
import {parseIdentifier} from "@webiny/utils/parseIdentifier.js";


export const FilterByEntryId = () => {
    const {setValue, getValue} = useForm();
    const bind = useBind({
        name: "data.entryId",
        beforeChange(value, cb) {
            const {id, version} = parseIdentifier(value)
            setValue("data.version", version || undefined);
            cb(id);
        }
    });
    
    return (
        <Input
            {...bind}
            size={"medium"}
            placeholder={"Filter by EntryId"}
        />
    );
};
