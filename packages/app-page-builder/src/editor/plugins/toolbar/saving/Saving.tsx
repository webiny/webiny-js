import React from "react";
import { uiAtom } from "@webiny/app-page-builder/editor/recoil/modules";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as SaveIcon } from "@webiny/app-page-builder/editor/assets/icons/baseline-cloud_upload-24px.svg";
import { ReactComponent as SavedIcon } from "@webiny/app-page-builder/editor/assets/icons/baseline-cloud_done-24px.svg";
import { useRecoilValue } from "recoil";

const Saving = () => {
    const { isSaving } = useRecoilValue(uiAtom);
    if (!isSaving) {
        return (
            <Tooltip placement={"right"} content={<span>{"All changes saved"}</span>}>
                <IconButton icon={<SavedIcon />} />
            </Tooltip>
        );
    }

    return (
        <Tooltip placement={"right"} content={<span>{"Saving changes ..."}</span>}>
            <IconButton icon={<SaveIcon />} />
        </Tooltip>
    );
};

export default React.memo(Saving);
