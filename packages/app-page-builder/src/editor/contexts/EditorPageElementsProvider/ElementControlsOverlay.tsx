import React, { useCallback } from "react";
import { Element, RendererMeta } from "@webiny/app-page-builder-elements/types";
import styled from "@emotion/styled";
import { CSSObject } from "@emotion/core";
import { useActiveElementId } from "~/editor/hooks/useActiveElementId";
import { useRenderer } from "@webiny/app-page-builder-elements";
import { useUI } from "~/editor/hooks/useUI";
import { useElementById } from "~/editor/hooks/useElementById";
import { PbEditorElement } from "~/types";
import { SetterOrUpdater } from "recoil";
import Draggable from "~/editor/components/Draggable";
import { disableDraggingMutation, enableDraggingMutation } from "~/editor/recoil/modules";

const ACTIVE_COLOR = "var(--mdc-theme-primary)";
const HOVER_COLOR = "var(--mdc-theme-secondary)";

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-element-controls-overlay": React.HTMLProps<HTMLDivElement>;
        }
    }
}

interface Props {
    children?: React.ReactNode;
    dropRef?: React.Ref<any>;
}

// Until the need for custom targets arises, we're hard-coding the available
// targets (types of elements onto which another element can be dropped).
const DEFAULT_TARGETS = ["cell", "block"];

// We're doing the same with the list of non-draggable elements.
const NON_DRAGGABLE_ELEMENTS = ["cell", "block"];

export const ElementControlsOverlay: React.FC<Props> = props => {
    const [{ isDragging }, setUi] = useUI();
    const [activeElementId, setActiveElementId] = useActiveElementId();

    const { getElement, meta } = useRenderer();
    const element = getElement();

    const [editorElement, updateEditorElement] = useElementById(element.id) as [
        PbEditorElement,
        SetterOrUpdater<PbEditorElement>
    ];

    const isActive = activeElementId === element.id;
    const isHighlighted = editorElement.isHighlighted;

    const { children, dropRef, ...rest } = props;

    const beginDrag = useCallback(() => {
        const data = { id: element.id, type: element.type };
        setTimeout(() => {
            setUi(enableDraggingMutation);
        });

        return { ...data, target: DEFAULT_TARGETS };
    }, [element.id]);

    const endDrag = useCallback(() => {
        setUi(disableDraggingMutation);
    }, [element.id]);

    const isDraggable = !NON_DRAGGABLE_ELEMENTS.includes(element.type);

    return (
        <Draggable
            enabled={isDraggable}
            target={DEFAULT_TARGETS}
            beginDrag={beginDrag}
            endDrag={endDrag}
        >
            {({ drag: dragRef }) => (
                <PbElementControlsOverlay
                    isDragging={isDragging}
                    isActive={isActive}
                    isHighlighted={isHighlighted}
                    element={element}
                    elementRendererMeta={meta}
                    onClick={() => {
                        updateEditorElement(element => ({ ...element, isHighlighted: false }));
                        setActiveElementId(element.id);
                    }}
                    onMouseEnter={(e: MouseEvent) => {
                        if (isActive || isHighlighted) {
                            return;
                        }

                        e.stopPropagation();
                        updateEditorElement(element => ({ ...element, isHighlighted: true }));
                    }}
                    onMouseLeave={(e: MouseEvent) => {
                        if (isActive || !isHighlighted) {
                            return;
                        }
                        e.stopPropagation();
                        updateEditorElement(element => ({ ...element, isHighlighted: false }));
                    }}
                    onDragEnter={(e: MouseEvent) => {
                        e.stopPropagation();
                        updateEditorElement(element => ({ ...element, dragEntered: true }));
                    }}
                    onDragLeave={(e: MouseEvent) => {
                        e.stopPropagation();
                        updateEditorElement(element => ({ ...element, dragEntered: false }));
                    }}
                    onDrop={() => {
                        // TODO: figure out why calling this update without the `setTimeout` hack doesn't work. 🤷‍
                        setTimeout(() =>
                            updateEditorElement(element => ({ ...element, dragEntered: false }))
                        );
                    }}
                    dropRef={dropRef}
                    dragRef={dragRef}
                    {...rest}
                >
                    {children}
                </PbElementControlsOverlay>
            )}
        </Draggable>
    );
};

const PbElementControlsOverlay = styled(
    ({
        className,
        onClick,
        onMouseEnter,
        onMouseLeave,
        onDragEnter,
        onDragLeave,
        onDrop,
        dropRef,
        dragRef,
        children
    }) => {
        return (
            <pb-element-controls-overlay
                // @ts-ignore Not supported by `React.HTMLProps<HTMLDivElement>`.
                class={className}
                onClick={onClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                ref={element => {
                    if (dropRef) {
                        dropRef(element);
                    }

                    if (dragRef) {
                        dragRef(element);
                    }
                }}
            >
                {children}
            </pb-element-controls-overlay>
        );
    }
)<{
    element: Element;
    elementRendererMeta: RendererMeta;
    isActive: boolean;
    isHighlighted: boolean;
    isDragging: boolean;
}>(({ element, elementRendererMeta, isActive, isHighlighted, isDragging }) => {
    // By default, the element controls overlay takes the size of the actual element.
    // But, if margins were set, they won't be taken into consideration. The shown
    // overlay is smaller than the actual space the page element takes. That's why,
    // when calculating the size of the overlay, we also need to take into consideration
    // any margins that the user might've set.
    const margins: CSSObject = elementRendererMeta.calculatedStyles.reduce(
        (current: CSSObject, item: CSSObject) => {
            if (item.margin) {
                current.marginTop = item.margin;
                current.marginRight = item.margin;
                current.marginBottom = item.margin;
                current.marginLeft = item.margin;
            } else {
                if (item.marginTop) {
                    current.marginTop = item.marginTop;
                }
                if (item.marginRight) {
                    current.marginRight = item.marginRight;
                }
                if (item.marginBottom) {
                    current.marginBottom = item.marginBottom;
                }
                if (item.marginLeft) {
                    current.marginLeft = item.marginLeft;
                }
            }

            return current;
        },
        {
            marginTop: "0px",
            marginRight: "0px",
            marginBottom: "0px",
            marginLeft: "0px"
        }
    );

    const hoverStyles: CSSObject = {};
    if (isHighlighted) {
        Object.assign(hoverStyles, {
            boxShadow: "inset 0px 0px 0px 2px " + HOVER_COLOR,
            "&::after": {
                backgroundColor: HOVER_COLOR,
                color: "#fff",
                content: `"${element.type}"`,
                position: "absolute",
                top: "-16px",
                right: "0",
                padding: "2px 5px",
                fontSize: "10px",
                textAlign: "center",
                lineHeight: "14px"
            }
        });
    }

    const activeStyles: CSSObject = {};
    if (isActive) {
        Object.assign(activeStyles, {
            boxShadow: "inset 0px 0px 0px 2px " + ACTIVE_COLOR,
            "&::after": {
                backgroundColor: ACTIVE_COLOR,
                color: "#fff",
                content: `"${element.type}"`,
                position: "absolute",
                top: "-16px",
                right: "0",
                padding: "2px 5px",
                fontSize: "10px",
                textAlign: "center",
                lineHeight: "14px"
            }
        });

        if (!isDragging) {
            // When an element is active, we're increasing the z-index of the actual page element.
            // We are putting it "in front of the user", above the element controls overlay.
            // This enables us to actually interact with the page element. For example, when
            // activating a paragraph page element, we get to type the paragraph text.
            Object.assign(activeStyles, {
                "& + *": {
                    zIndex: 5,
                    position: "relative"
                }
            });
        }
    }

    return {
        display: "block",
        position: "absolute",
        zIndex: 1,
        top: `calc(0px - ${margins.marginTop})`,
        left: `calc(0px - ${margins.marginLeft})`,
        width: `calc(100%  + ${margins.marginLeft} + ${margins.marginRight})`,
        height: `calc(100%  + ${margins.marginTop} + ${margins.marginBottom})`,
        transition: "box-shadow 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)",
        cursor: "pointer",
        ...hoverStyles,
        ...activeStyles
    };
});
