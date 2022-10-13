import React, { useCallback } from "react";
import { useEventActionHandler } from "../../../hooks/useEventActionHandler";
import { DeleteElementActionEvent } from "../../../recoil/actions";
import { activeElementAtom, elementByIdSelector } from "../../../recoil/modules";
import { plugins } from "@webiny/plugins";
import { PbEditorPageElementPlugin, PbBlockVariable, PbEditorElement } from "~/types";
import { useRecoilValue } from "recoil";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { useParentBlock } from "~/editor/hooks/useParentBlock";

const removeVariableFromBlock = (block: PbEditorElement, variableId: string) => {
    const updatedVariables = block.data.variables.filter(
        (variable: PbBlockVariable) => variable.id !== variableId
    );

    return {
        ...block,
        data: {
            ...block.data,
            variables: updatedVariables
        }
    };
};

interface DeleteActionPropsType {
    children: React.ReactElement;
}
const DeleteAction: React.FC<DeleteActionPropsType> = ({ children }) => {
    const eventActionHandler = useEventActionHandler();
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(elementByIdSelector(activeElementId as string));
    const block = useParentBlock(activeElementId as string);
    const updateElement = useUpdateElement();

    if (!element) {
        return null;
    }

    const onClick = useCallback((): void => {
        // We need to remove element variable from block if it exists
        if (element.data?.variableId && block) {
            const updatedBlock = removeVariableFromBlock(block, element.data.variableId);

            updateElement(updatedBlock);
        }
        eventActionHandler.trigger(
            new DeleteElementActionEvent({
                element
            })
        );
    }, [activeElementId]);

    const plugin = plugins
        .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
        .find(pl => pl.elementType === element.type);

    if (!plugin) {
        return null;
    }

    if (typeof plugin.canDelete === "function") {
        if (!plugin.canDelete({ element })) {
            return null;
        }
    }

    return React.cloneElement(children, { onClick });
};

export default React.memo(DeleteAction);
