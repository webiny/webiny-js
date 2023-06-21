import React from "react";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete";
import { useBind } from "@webiny/form";
import { useFile, useFileManagerApi, useFileManagerView } from "~/index";

export const Tags = () => {
    const { file } = useFile();
    const { canEdit } = useFileManagerApi();
    const { tags } = useFileManagerView();

    const bind = useBind<string[]>({
        name: "tags"
    });

    return (
        <MultiAutoComplete
            {...bind}
            value={(bind.value || []).filter(tag => !tag.startsWith("mime:"))}
            options={tags.allTags.map(tagItem => tagItem.tag)}
            label={"Tags"}
            description={"Type in a new tag or select an existing one."}
            unique={true}
            allowFreeInput={true}
            useSimpleValues={true}
            disabled={!canEdit(file)}
        />
    );
};
