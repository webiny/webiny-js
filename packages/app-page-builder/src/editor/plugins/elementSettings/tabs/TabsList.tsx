import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { activeElementAtom, elementWithChildrenByIdSelector } from "~/editor/recoil/modules";
import Accordion from "~/editor/plugins/elementSettings/components/Accordion";
import { moveInPlace, useSortableList } from "~/hooks/useSortableList";
import { Collapsable } from "~/editor/defaultConfig/Toolbar/Navigator/StyledComponents";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { ReactComponent as DragIndicatorIcon } from "~/editor/defaultConfig/Toolbar/Navigator/assets/drag_indicator_24px.svg";
import { ReactComponent as DeleteIcon } from "~/editor/assets/icons/delete.svg";
import { createElement } from "~/editor/helpers";
import { PbEditorElement } from "~/types";

const accordionStyles = css`
    .accordion-content {
        padding: 0;
    }
`;

const ButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 16px;
    margin-bottom: 16px;
`;

const ListItemStyled = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid var(--mdc-theme-background);

    &:hover {
        background-color: var(--mdc-theme-background);
        color: var(--mdc-theme-primary);

        & > div {
            display: block;
        }
    }

    & > svg {
        cursor: move;
        flex-shrink: 0;
    }
`;

const DeleteIconWrapper = styled.div`
    display: none;
    margin-left: auto;
    margin-right: 16px;
    height: 24px;
    cursor: pointer;

    & > svg {
        fill: var(--mdc-theme-text-secondary-on-background);
        transition: fill 0.2s;
    }

    &:hover {
        & > svg {
            fill: var(--mdc-theme-text-primary-on-background);
        }
    }
`;

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
    if (!isOver || elementType !== "tab") {
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

const ListItem = ({
    element,
    index,
    move,
    canRemove,
    onRemove
}: {
    element: PbEditorElement;
    index: number;
    move: (current: number, next: number) => void;
    canRemove: boolean;
    onRemove: (variableId: string) => void;
}) => {
    const {
        ref: dragAndDropRef,
        handlerId,
        isOver,
        dropItemAbove
    } = useSortableList({
        move,
        id: element.id,
        index,
        type: "tab"
    });

    const highlightItem = getHighlightItemProps({
        isOver,
        dropItemAbove,
        elementType: "tab"
    });

    return (
        <Collapsable ref={dragAndDropRef} data-handler-id={handlerId} highlightItem={highlightItem}>
            <ListItemStyled>
                {element?.data?.settings?.tab?.label}
                {canRemove && (
                    <DeleteIconWrapper>
                        <DeleteIcon onClick={() => onRemove(element.id)} />
                    </DeleteIconWrapper>
                )}
                <DragIndicatorIcon />
            </ListItemStyled>
        </Collapsable>
    );
};

const AccordionItemsList = () => {
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(
        elementWithChildrenByIdSelector(activeElementId)
    ) as PbEditorElement;
    const updateElement = useUpdateElement();

    const { showConfirmation } = useConfirmationDialog({
        title: "Remove tab",
        message: <p>Are you sure you want to remove this tab?</p>
    });

    const onMove = useCallback(
        (current: number, next: number) => {
            const reorderedElements = moveInPlace(element?.elements, current, next);

            updateElement({
                ...element,
                elements: reorderedElements
            });
        },
        [element]
    );

    const onRemove = useCallback(
        (elementId: string) => {
            showConfirmation(async () => {
                updateElement({
                    ...element,
                    elements: (element.elements as PbEditorElement[]).filter(
                        element => element.id !== elementId
                    )
                });
            });
        },
        [element]
    );

    const onCreate = useCallback(() => {
        updateElement({
            ...element,
            elements: [...element.elements, createElement("tab")]
        });
    }, [element]);

    return (
        <Accordion title={"Tabs"} defaultValue={true} className={accordionStyles}>
            <>
                {(element.elements as PbEditorElement[]).map((tabElement, index: number) => (
                    <ListItem
                        key={index}
                        index={index}
                        element={tabElement}
                        move={onMove}
                        canRemove={element.elements.length > 1}
                        onRemove={onRemove}
                    />
                ))}
                <ButtonWrapper>
                    <ButtonSecondary onClick={onCreate}>
                        <ButtonIcon icon={<AddIcon />} /> Add Tab
                    </ButtonSecondary>
                </ButtonWrapper>
            </>
        </Accordion>
    );
};

export default React.memo(AccordionItemsList);
