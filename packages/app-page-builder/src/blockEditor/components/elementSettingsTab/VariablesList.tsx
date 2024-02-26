import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { PbEditorElement, PbBlockVariable, PbElement } from "~/types";
import { Typography } from "@webiny/ui/Typography";
import { useMoveVariable } from "~/blockEditor/components/elementSettingsTab/variablesListHooks";
import { useSortableList } from "~/hooks/useSortableList";
import { Collapsable } from "~/editor/plugins/toolbar/navigator/StyledComponents";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { ReactComponent as DragIndicatorIcon } from "~/editor/plugins/toolbar/navigator/assets/drag_indicator_24px.svg";
import { ReactComponent as DeleteIcon } from "~/editor/assets/icons/delete.svg";
import { findElementByVariableId } from "~/blockEditor/config/eventActions/saveBlock";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";

const TitleWrapper = styled("div")({
    padding: "16px",
    textAlign: "center"
});

const VariableItem = styled("div")({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px",
    borderTop: "1px solid var(--mdc-theme-background)",

    "&:hover": {
        backgroundColor: "var(--mdc-theme-background)",
        color: "var(--mdc-theme-primary)",

        "&>div": {
            display: "block"
        }
    },

    "&>svg": {
        cursor: "move"
    }
});

const DeleteIconWrapper = styled("div")({
    display: "none",
    marginLeft: "auto",
    marginRight: "16px",
    height: "24px",
    cursor: "pointer",

    "&>svg": {
        fill: "var(--mdc-theme-text-secondary-on-background)",
        transition: "fill 0.2s"
    },

    "&:hover": {
        "&>svg": {
            fill: "var(--mdc-theme-text-primary-on-background)"
        }
    }
});

interface GetHighlightItemPropsParams {
    dropItemAbove?: boolean;
    isOver?: boolean;
    elementType: string;
}

const getHighlightItemProps = ({
    dropItemAbove,
    isOver,
    elementType
}: GetHighlightItemPropsParams) => {
    if (!isOver || elementType !== "variable") {
        return {
            top: false,
            bottom: false
        };
    }
    if (dropItemAbove) {
        return {
            top: true,
            bottom: false
        };
    }
    return {
        top: false,
        bottom: true
    };
};

const VariablesListItem = ({
    variable,
    index,
    move,
    onRemove
}: {
    variable: PbBlockVariable;
    index: number;
    move: (current: number, next: number) => void;
    onRemove: (variableId: string) => void;
}) => {
    const {
        ref: dragAndDropRef,
        handlerId,
        isOver,
        dropItemAbove
    } = useSortableList({
        move,
        id: variable.id,
        index,
        type: "variable"
    });

    const highlightItem = getHighlightItemProps({
        isOver,
        dropItemAbove,
        elementType: "variable"
    });

    return (
        <Collapsable ref={dragAndDropRef} data-handler-id={handlerId} highlightItem={highlightItem}>
            <VariableItem>
                {variable?.label}
                <DeleteIconWrapper>
                    <DeleteIcon onClick={() => onRemove(variable.id)} />
                </DeleteIconWrapper>
                <DragIndicatorIcon />
            </VariableItem>
        </Collapsable>
    );
};

const VariablesList = ({ block }: { block: PbEditorElement }) => {
    const { move } = useMoveVariable(block);
    const updateElement = useUpdateElement();
    const { getElementTree } = useEventActionHandler();

    const { showConfirmation } = useConfirmationDialog({
        title: "Remove variable",
        message: <p>Are you sure you want to remove this variable?</p>
    });

    const onRemove = useCallback(
        (variableId: string) => {
            showConfirmation(async () => {
                if (block && block.id) {
                    // remove variable from block
                    const variables = block.data.variables ?? [];
                    const updatedVariables = variables.filter(
                        (variable: PbBlockVariable) => variable.id !== variableId
                    );
                    updateElement({
                        ...block,
                        data: {
                            ...block.data,
                            variables: updatedVariables
                        }
                    });

                    // check if there are more variables of this element
                    const isLastVariableOfElement = !updatedVariables.some(
                        (variable: PbBlockVariable) =>
                            variable.id.split(".")[0] === variableId.split(".")[0]
                    );

                    // if there are not, then remove variableId from element
                    if (isLastVariableOfElement) {
                        const pbBlockElement = (await getElementTree()) as PbElement;
                        const element = findElementByVariableId(
                            pbBlockElement.elements,
                            variableId.split(".")[0]
                        );

                        // element "variableId" value should be dropped
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { variableId: elementVariableId, ...updatedElementData } =
                            element.data;
                        updateElement({
                            ...element,
                            data: updatedElementData
                        });
                    }
                }
            });
        },
        [block]
    );

    return (
        <>
            <TitleWrapper>
                <Typography use="headline6">Block variables</Typography>
            </TitleWrapper>
            {block?.data?.variables?.map((variable: PbBlockVariable, index: number) => (
                <VariablesListItem
                    key={index}
                    index={index}
                    variable={variable}
                    move={move}
                    onRemove={onRemove}
                />
            ))}
        </>
    );
};

export default VariablesList;
