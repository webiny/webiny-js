import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as SaveIcon } from "~/editor/assets/icons/baseline-cloud_upload-24px.svg";
import { ReactComponent as SavedIcon } from "~/editor/assets/icons/baseline-cloud_done-24px.svg";
import { useUI } from "~/editor/hooks/useUI";

const Saving: React.FC = () => {
    const [{ isSaving }] = useUI();
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
