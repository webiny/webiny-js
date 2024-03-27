import React from "react";
import { ReactComponent as EditIcon } from "@material-design-icons/svg/round/edit.svg";
import { TemplateEditorConfig } from "~/templateEditor/editorConfig/TemplateEditorConfig";
import { useBlockReference } from "./useBlockReference";

const { ElementAction } = TemplateEditorConfig;

export const EditBlockAction = () => {
    const blockReference = useBlockReference();

    if (!blockReference) {
        return null;
    }

    return (
        <ElementAction.IconButton
            label={"Edit block"}
            icon={<EditIcon />}
            onClick={() =>
                window.open(
                    `/page-builder/block-editor/${blockReference.referencedBlockId}`,
                    "_blank",
                    "noopener"
                )
            }
        />
    );
};
