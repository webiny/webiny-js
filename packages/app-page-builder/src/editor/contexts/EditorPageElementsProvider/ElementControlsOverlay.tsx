import React, { useCallback, useMemo } from "react";
import { Element, RendererMeta } from "@webiny/app-page-builder-elements/types";
import styled from "@emotion/styled";
import { CSSObject } from "@emotion/react";
import { useActiveElementId } from "~/editor/hooks/useActiveElementId";
import { useRenderer } from "@webiny/app-page-builder-elements";
import { plugins } from "@webiny/plugins";
import { useUI } from "~/editor/hooks/useUI";
import { useElementById } from "~/editor/hooks/useElementById";
import { PbEditorElement, PbEditorBlockPlugin } from "~/types";
import { SetterOrUpdater } from "recoil";
import Draggable from "~/editor/components/Draggable";
import { disableDraggingMutation, enableDraggingMutation } from "~/editor/recoil/modules";
import { ElementControlsOverlayBorders } from "./ElementControlsOverlay/ElementControlsOverlayBorders";
import { ConnectDragSource } from "react-dnd";
import { useElementPlugin } from "~/editor/contexts/EditorPageElementsProvider/useElementPlugin";
import { getElementTitle } from "~/editor/contexts/EditorPageElementsProvider/getElementTitle";

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-eco": React.HTMLProps<HTMLDivElement>;
        }
    }
}

// Basic border colors.
const ACTIVE_COLOR = "var(--mdc-theme-primary)";
const HOVER_COLOR = "var(--mdc-theme-secondary)";

type PbElementControlsOverlayProps = React.HTMLProps<HTMLDivElement> & {
    className?: string;
    element: Element;
    elementRendererMeta: RendererMeta;
    isActive: boolean;
    isHighlighted: boolean;
    isDragging: boolean;
    dropRef?: React.RefCallback<any>;
    dragRef?: ConnectDragSource | null;
    zIndex: number;
};

const PbElementControlsOverlay = ({
    className,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onDragEnter,
    onDragLeave,
    onDrop,
    dropRef,
    dragRef,
    isActive,
    zIndex,
    children
}: PbElementControlsOverlayProps) => {
    return (
        <>
            {isActive && <ElementControlsOverlayBorders zIndex={zIndex} color={ACTIVE_COLOR} />}
            <pb-eco
                // @ts-expect-error Not supported by `React.HTMLProps<HTMLDivElement>`.
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
            </pb-eco>
        </>
    );
};

const titleContainerBaseStyles = {
    color: "#fff",
    position: "absolute",
    padding: "2px 5px",
    fontSize: "10px",
    textAlign: "center",
    lineHeight: "14px",
    top: "-16px",
    right: "0"
};

const StyledPbElementControlsOverlay = styled(
    PbElementControlsOverlay
)<PbElementControlsOverlayProps>(
    ({ title, zIndex, elementRendererMeta, isActive, isHighlighted, isDragging }) => {
        const hoverStyles: CSSObject = {};
        if (isHighlighted) {
            Object.assign(hoverStyles, {
                boxShadow: "inset 0px 0px 0px 2px " + HOVER_COLOR,
                "&::after": {
                    ...titleContainerBaseStyles,
                    backgroundColor: HOVER_COLOR,
                    content: `"${title}"`
                }
            });
        }

        const activeStyles: CSSObject = {};
        if (isActive) {
            Object.assign(hoverStyles, {
                // No need to apply the box shadow here. Active page element's
                // borders are handled separately (`ElementControlsOverlayBorders`).
                // boxShadow: "inset 0px 0px 0px 2px " + ACTIVE_COLOR,
                "&::after": {
                    ...titleContainerBaseStyles,
                    backgroundColor: ACTIVE_COLOR,
                    content: `"${title}"`
                }
            });

            if (!isDragging) {
                // When an element is active, we're increasing the z-index of the actual page element.
                // We are putting it "in front of the user", above the element controls overlay.
                // This enables us to actually interact with the page element. For example, when
                // activating a paragraph page element, we get to type the paragraph text.

                // Note that we don't want to assign the z-index to the element if it's part of
                // a block (created via Block module or if it's a page created from a template).
                // In that case, we want the block to be on top of the element at all times. No
                // need to increase the z-index of the element and make it interactive.
                const isSavedBlock =
                    elementRendererMeta.blockId || elementRendererMeta.templateBlockId;
                if (!isSavedBlock) {
                    Object.assign(activeStyles, {
                        "& + *": {
                            zIndex: zIndex + 5,
                            position: "relative"
                        }
                    });
                }

                // Note that we don't apply active border styles here. We do that via the `pb-eco-border`
                // elements, rendered within the `PbElementControlsOverlayBaseComponent` component.
            }
        }

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

        return {
            display: "block",
            position: "absolute",
            zIndex,
            top: `calc(0px - ${margins.marginTop})`,
            left: `calc(0px - ${margins.marginLeft})`,
            width: `calc(100%  + ${margins.marginLeft} + ${margins.marginRight})`,
            height: `calc(100%  + ${margins.marginTop} + ${margins.marginBottom})`,
            transition: "box-shadow 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)",
            cursor: "pointer",
            ...hoverStyles,
            ...activeStyles
        };
    }
);

interface Props {
    children?: React.ReactNode;
    dropRef?: React.RefCallback<any>;
}

export const ElementControlsOverlay = (props: Props) => {
    const [{ isDragging }, setUi] = useUI();
    const [activeElementId, setActiveElementId] = useActiveElementId();

    const { getElement, meta } = useRenderer();
    const element = getElement();

    const [editorElement, updateEditorElement] = useElementById(element.id) as [
        PbEditorElement,
        SetterOrUpdater<PbEditorElement>
    ];

    const isActive = activeElementId === element.id;
    const isHighlighted = editorElement?.isHighlighted ?? false;

    const { children, dropRef, ...rest } = props;

    const elementPlugin = useElementPlugin(element);
    const elementTargets = elementPlugin?.target || [];

    let isDraggable = false;
    if (elementPlugin) {
        isDraggable = Array.isArray(elementPlugin?.target) && elementPlugin.target.length > 0;
    }

    const beginDrag = useCallback(() => {
        const data = { id: element.id, type: element.type };
        setTimeout(() => {
            setUi(enableDraggingMutation);
        });

        return { ...data, target: elementTargets };
    }, [element.id]);

    const endDrag = useCallback(() => {
        setUi(disableDraggingMutation);
    }, [element.id]);

    const title = useMemo(() => {
        if (element.data.blockId) {
            const blockPlugin = plugins
                .byType<PbEditorBlockPlugin>("pb-editor-block")
                .find(block => block.id === element.data.blockId);

            if (blockPlugin) {
                return `block | ${blockPlugin.title}`;
            }

            return "block | unknown";
        }

        return getElementTitle(element.type, element.id);
    }, [element.data.blockId]);

    // Z-index of element controls overlay depends on the depth of the page element.
    // The deeper the page element is in the content hierarchy, the greater the index.
    const zIndex = meta.depth * 10;

    return (
        <Draggable
            enabled={isDraggable}
            target={elementTargets}
            beginDrag={beginDrag}
            endDrag={endDrag}
        >
            {({ drag: dragRef }) => (
                <StyledPbElementControlsOverlay
                    title={title}
                    zIndex={zIndex}
                    isDragging={isDragging}
                    isActive={isActive}
                    isHighlighted={isHighlighted}
                    element={element}
                    elementRendererMeta={meta}
                    onClick={() => {
                        updateEditorElement(element => ({ ...element, isHighlighted: false }));
                        setActiveElementId(element.id);
                    }}
                    onMouseEnter={e => {
                        if (isActive || isHighlighted) {
                            return;
                        }

                        e.stopPropagation();
                        updateEditorElement(element => ({ ...element, isHighlighted: true }));
                    }}
                    onMouseLeave={e => {
                        if (isActive || !isHighlighted) {
                            return;
                        }
                        e.stopPropagation();
                        updateEditorElement(element => ({ ...element, isHighlighted: false }));
                    }}
                    onDragEnter={e => {
                        e.stopPropagation();
                        updateEditorElement(element => ({ ...element, dragEntered: true }));
                    }}
                    onDragLeave={e => {
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
                </StyledPbElementControlsOverlay>
            )}
        </Draggable>
    );
};
