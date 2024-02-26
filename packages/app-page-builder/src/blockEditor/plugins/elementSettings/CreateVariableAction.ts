import React, { useCallback } from "react";
import { plugins } from "@webiny/plugins";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { useCurrentBlockElement } from "~/editor/hooks/useCurrentBlockElement";
import { PbBlockEditorCreateVariablePlugin } from "~/types";

interface CreateVariableActionPropsType {
    children: React.ReactElement;
}

const CreateVariableAction = ({ children }: CreateVariableActionPropsType) => {
    const [element] = useActiveElement();
    const { block } = useCurrentBlockElement();
    const updateElement = useUpdateElement();

    const onClick = useCallback((): void => {
        if (element && block) {
            const createVariablePlugins = plugins.byType<PbBlockEditorCreateVariablePlugin>(
                "pb-block-editor-create-variable"
            );
            const variablePlugin = createVariablePlugins.find(
                plugin => plugin.elementType === element.type
            );

            if (!variablePlugin) {
                return;
            }

            updateElement({
                ...element,
                data: { ...element.data, variableId: element.id }
            });
            updateElement({
                ...block,
                data: {
                    ...block.data,
                    variables: [
                        ...(block.data?.variables || []),
                        ...variablePlugin.createVariables({ element })
                    ]
                }
            });
        }
    }, [element, block, updateElement]);

    return React.cloneElement(children, { onClick });
};

export default React.memo(CreateVariableAction);
