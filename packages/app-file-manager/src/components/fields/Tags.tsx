import React from "react";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete";
import { useBind } from "@webiny/form";
import { useFileManagerApi, useFileManagerView } from "~/index";
import { useFileOrUndefined } from "./useFileOrUndefined";

export const Tags = () => {
    const { file } = useFileOrUndefined();
    const { canEdit } = useFileManagerApi();
    const { tags } = useFileManagerView();

    const bind = useBind({
        name: "tags"
    });

    return (
        <MultiAutoComplete
            {...bind}
            value={(bind.value || []).filter((tag: string) => !tag.startsWith("mime:"))}
            options={tags.allTags.map(tagItem => tagItem.tag)}
            label={"Tags"}
            description={"Type in a new tag or select an existing one."}
            unique={true}
            allowFreeInput={true}
            useSimpleValues={true}
            disabled={file ? !canEdit(file) : false}
        />
    );
};
