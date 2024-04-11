import React from "react";
import { EditorConfig } from "~/editor/config";
import { useUI } from "~/editor/hooks/useUI";
import { ReactComponent as SaveIcon } from "~/editor/assets/icons/baseline-cloud_upload-24px.svg";
import { ReactComponent as SavedIcon } from "~/editor/assets/icons/baseline-cloud_done-24px.svg";

const { Ui } = EditorConfig;

export const Saving = () => {
    const [{ isSaving }] = useUI();

    if (!isSaving) {
        return <Ui.Toolbar.Element.IconButton label={"All changes saved!"} icon={<SavedIcon />} />;
    }

    return <Ui.Toolbar.Element.IconButton label={"Saving changes ..."} icon={<SaveIcon />} />;
};
