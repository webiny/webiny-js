import React from "react";
import { ReactComponent as MirrorIcon } from "~/editor/assets/icons/mirror_cell.svg";
import MirrorCellAction from "./MirrorCellAction";
import Action from "../components/Action";
import { PbEditorPageElementSettingsPlugin } from "~/types";

export default {
    name: "pb-editor-page-element-settings-mirror-cell",
    type: "pb-editor-page-element-settings",
    renderAction() {
        return (
            <MirrorCellAction>
                <Action tooltip={"Mirror cell"} icon={<MirrorIcon />} />
            </MirrorCellAction>
        );
    }
} as PbEditorPageElementSettingsPlugin;
