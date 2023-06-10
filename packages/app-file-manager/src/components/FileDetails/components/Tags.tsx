import React from "react";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete";
import { useBind } from "@webiny/form";
import { useFile, useFileManagerApi, useFileDetails } from "~/index";
import { useTags } from "@webiny/app-aco";
import { getTagsInitialParams, tagsModifier } from "~/tagsHelpers";

export const Tags = () => {
    const { own, scope } = useFileDetails();
    const { file } = useFile();
    const { canEdit } = useFileManagerApi();
    const { tags } = useTags({
        tagsModifier: tagsModifier(scope),
        where: getTagsInitialParams({ scope, own })
    });

    const bind = useBind({
        name: "tags"
    });

    return (
        <MultiAutoComplete
            {...bind}
            options={tags.map(tagItem => tagItem.tag)}
            label={"Tags"}
            description={"Type in a new tag or select an existing one."}
            unique={true}
            allowFreeInput={true}
            useSimpleValues={true}
            disabled={!canEdit(file)}
        />
    );
};
