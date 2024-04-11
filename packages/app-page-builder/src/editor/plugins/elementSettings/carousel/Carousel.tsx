import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import { PbEditorElement } from "~/types";
import { createElement } from "~/editor/helpers";
import { moveInPlace, useSortableList } from "~/hooks/useSortableList";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { ReactComponent as DeleteIcon } from "~/editor/assets/icons/delete.svg";
import { activeElementAtom, elementWithChildrenByIdSelector } from "~/editor/recoil/modules";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import Accordion from "~/editor/plugins/elementSettings/components/Accordion";
import { Collapsable } from "~/editor/defaultConfig/Toolbar/Navigator/StyledComponents";
import { ReactComponent as DragIndicatorIcon } from "~/editor/defaultConfig/Toolbar/Navigator/assets/drag_indicator_24px.svg";

const accordionStyles = css`
    .accordion-content {
        padding: 0;
    }
`;

const CarouselListStyled = styled.div`
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

const ButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 16px;
    margin-bottom: 16px;
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
    if (!isOver || elementType !== "carousel-element") {
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

const CarouselItem = ({
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
        type: "carousel-element"
    });

    const highlightItem = getHighlightItemProps({
        isOver,
        dropItemAbove,
        elementType: "carousel-element"
    });

    return (
        <Collapsable ref={dragAndDropRef} data-handler-id={handlerId} highlightItem={highlightItem}>
            <CarouselListStyled>
                {element?.data?.settings?.carouselElement?.label}
                {canRemove && (
                    <DeleteIconWrapper>
                        <DeleteIcon onClick={() => onRemove(element.id)} />
                    </DeleteIconWrapper>
                )}
                <DragIndicatorIcon />
            </CarouselListStyled>
        </Collapsable>
    );
};

const CarouselItems = () => {
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(
        elementWithChildrenByIdSelector(activeElementId)
    ) as PbEditorElement;
    const updateElement = useUpdateElement();

    const { showConfirmation } = useConfirmationDialog({
        title: "Remove slide",
        message: <p>Are you sure you want to remove this slide?</p>
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
            elements: [...element.elements, createElement("carousel-element")]
        });
    }, [element]);

    return (
        <Accordion title={"Slides"} defaultValue={true} className={accordionStyles}>
            <>
                {(element.elements as PbEditorElement[]).map((carouselElement, index: number) => (
                    <CarouselItem
                        key={index}
                        index={index}
                        element={carouselElement}
                        move={onMove}
                        canRemove={element.elements.length > 1}
                        onRemove={onRemove}
                    />
                ))}
                <ButtonWrapper>
                    <ButtonSecondary onClick={onCreate}>
                        <ButtonIcon icon={<AddIcon />} /> Add Carousel Element
                    </ButtonSecondary>
                </ButtonWrapper>
            </>
        </Accordion>
    );
};

export default CarouselItems;
