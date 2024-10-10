import React, { useCallback } from "react";
import { plugins } from "@webiny/plugins";
import { useActiveElement, useEventActionHandler } from "~/editor";
import { PbEditorPageElementPlugin, PbBlockVariable, PbEditorElement } from "~/types";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { useParentBlock } from "~/editor/hooks/useParentBlock";
import { DeleteElementActionEvent } from "~/editor/recoil/actions";

const removeVariableFromBlock = (block: PbEditorElement, variableId: string) => {
    const variables = block.data.variables ?? [];

    const updatedVariables = variables.filter(
        (variable: PbBlockVariable) => variable.id.split(".")[0] !== variableId
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
const DeleteAction = ({ children }: DeleteActionPropsType) => {
    const eventActionHandler = useEventActionHandler();
    const [element] = useActiveElement();
    const block = useParentBlock();
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
    }, [element.id]);

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
