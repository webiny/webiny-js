import React, { useMemo } from "react";
import { Label, MultiAutoComplete } from "@webiny/admin-ui";
import { useBind } from "@webiny/form";
import { useFileManagerApi } from "~/index.js";
import { useFileManagerPresenter } from "~/presentation/FileList/FileManagerPresenterProvider.js";
import { THREAT_SCAN } from "~/modules/Enterprise/constants.js";
import { useFileOrUndefined } from "./useFileOrUndefined.js";

export const Tags = () => {
    const { file } = useFileOrUndefined();
    const { canEdit } = useFileManagerApi();
    const { vm } = useFileManagerPresenter();

    const bind = useBind({
        name: "tags"
    });

    const values = useMemo(() => {
        return (bind.value || []).filter((tag: string) => {
            return !tag.startsWith("mime:") || tag !== THREAT_SCAN.IN_PROGRESS;
        });
    }, [bind.value]);

    return (
        <MultiAutoComplete
            {...bind}
            values={values}
            onValuesChange={bind.onChange}
            options={vm.tags.map(tagItem => tagItem.tag)}
            label={
                <Label text={"Tags"} hint={"Type to add a new tag or select from suggestions."} />
            }
            uniqueValues={true}
            allowFreeInput={true}
            disabled={file ? !canEdit(file) : false}
        />
    );
};
