import React, { useCallback } from "react";
import startCase from "lodash/startCase";
import camelCase from "lodash/camelCase";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { useCurrentBlockElement } from "~/editor/hooks/useCurrentBlockElement";

interface CreateVariableActionPropsType {
    children: React.ReactElement;
}

const CreateVariableAction: React.FC<CreateVariableActionPropsType> = ({ children }) => {
    const [element] = useActiveElement();
    const { block } = useCurrentBlockElement();
    const updateElement = useUpdateElement();

    const onClick = useCallback((): void => {
        if (element && !element.data?.varRef && block && block.id) {
            updateElement({
                ...element,
                data: { ...element.data, varRef: element.id }
            });
            updateElement({
                ...block,
                data: {
                    ...block.data,
                    variables: [
                        ...(block.data?.variables || []),
                        {
                            varRef: element.id,
                            label: startCase(camelCase(element.type))
                        }
                    ]
                }
            });
        }
    }, [element, block, updateElement]);

    return React.cloneElement(children, { onClick });
};

export default React.memo(CreateVariableAction);
