import React from "react";
import { PageElementsProvider as PbPageElementsProvider } from "@webiny/app-page-builder-elements/contexts/PageElements";

// Attributes modifiers.
import { createId } from "@webiny/app-page-builder-elements/modifiers/attributes/id";

// Styles modifiers.
import { createBackground } from "@webiny/app-page-builder-elements/modifiers/styles/background";
import { createBorder } from "@webiny/app-page-builder-elements/modifiers/styles/border";
import { createHeight } from "@webiny/app-page-builder-elements/modifiers/styles/height";
import { createHorizontalAlign } from "@webiny/app-page-builder-elements/modifiers/styles/horizontalAlign";
import { createMargin } from "@webiny/app-page-builder-elements/modifiers/styles/margin";
import { createPadding } from "@webiny/app-page-builder-elements/modifiers/styles/padding";
import { createShadow } from "@webiny/app-page-builder-elements/modifiers/styles/shadow";
import { createText } from "@webiny/app-page-builder-elements/modifiers/styles/text";
import { createTextAlign } from "@webiny/app-page-builder-elements/modifiers/styles/textAlign";
import { createVerticalAlign } from "@webiny/app-page-builder-elements/modifiers/styles/verticalAlign";
import { createVisibility } from "@webiny/app-page-builder-elements/modifiers/styles/visibility";
import { createWidth } from "@webiny/app-page-builder-elements/modifiers/styles/width";

import { usePageBuilder } from "~/hooks/usePageBuilder";
import { Theme } from "@webiny/app-page-builder-theme/types";
import { plugins } from "@webiny/plugins";
import { PbEditorPageElementPlugin } from "~/types";
import { useRenderer } from "@webiny/app-page-builder-elements";
import { useActiveElementId } from "@webiny/app-page-builder/editor/hooks/useActiveElementId";
import { ClassNames, CSSObject } from "@emotion/core";
import { createClassName } from "@webiny/app-page-builder-elements/modifiers/attributes/className";
import { DropElementActionEvent } from "~/editor/recoil/actions";
import Droppable, { DragObjectWithTypeWithTarget } from "~/editor/components/Droppable";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";

declare global {
    namespace JSX {
        import MouseEnterEvent = JQuery.MouseEnterEvent;

        interface IntrinsicElements {
            "pb-element-control": {
                children?: React.ReactNode;
                ref: React.Ref<any>;
                onClick: () => void;
                class: string;
                onMouseEnter: React.MouseEventHandler;
                onMouseLeave: React.MouseEventHandler;
            };
        }
    }
}

export const EditorControls = () => {
    const { getElement, meta } = useRenderer();
    const [activeElementId, setActiveElementId] = useActiveElementId();
    const element = getElement();
    const handler = useEventActionHandler();

    const { id, type } = element;

    const dropElementAction = (source: DragObjectWithTypeWithTarget, position: number) => {
        handler.trigger(
            new DropElementActionEvent({
                source,
                target: {
                    id,
                    type,
                    position
                }
            })
        );
    };

    if (element.type === "document") {
        return null;
    }

    const activeColor = "var(--mdc-theme-primary)";
    const hoverColor = "var(--mdc-theme-secondary)";

    const margins = meta.calculatedStyles.reduce((current, item) => {
        if (item.margin) {
            current.marginTop = item.margin;
            current.marginRight = item.margin;
            current.marginBottom = item.margin;
            current.marginLeft = item.margin;
        } else if (item.marginTop) {
            current.marginTop = item.marginTop;
        } else if (item.marginRight) {
            current.marginRight = item.marginRight;
        } else if (item.marginBottom) {
            current.marginBottom = item.marginBottom;
        } else if (item.marginLeft) {
            current.marginLeft = item.marginLeft;
        }

        return current;
    }, {});

    const elementControlStyles: CSSObject = {
        outline: element.type === "cell" ? "1px dashed #757575" : undefined,
        position: "absolute",
        zIndex: 1,
        top: `calc(0px - ${margins.marginTop})`,
        left: 0,
        width: "100%",
        height: `calc(100%  + ${margins.marginTop})`,
        transition: "box-shadow 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)",
        cursor: "pointer",
        "&.hover": {
            boxShadow: "inset 0px 0px 0px 2px " + hoverColor,
            "&::after": {
                backgroundColor: hoverColor,
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
        },
        "&.active": {
            boxShadow: "inset 0px 0px 0px 2px " + activeColor,
            "&::after": {
                backgroundColor: activeColor,
                color: "#fff",
                content: `"${element.type}"`,
                position: "absolute",
                top: "-16px",
                right: "0",
                padding: "2px 5px",
                fontSize: "10px",
                textAlign: "center",
                lineHeight: "14px"
            },
            "& + *": {
                zIndex: 100,
                position: "relative"
            }
        }
    };

    const isActive = activeElementId === id;

    return (
        <Droppable
            onDrop={source => dropElementAction(source, 0)}
            type={type}
            isVisible={() => true}
        >
            {({ drop }) => (
                <ClassNames>
                    {({ cx, css }) => (
                        <pb-element-control
                            ref={drop}
                            onClick={() => setActiveElementId(id)}
                            class={cx(css(elementControlStyles), { active: isActive })}
                            onMouseEnter={e => {
                                e.stopPropagation();
                                // @ts-ignore Figure out the correct type.
                                e.target.classList.add("hover");
                            }}
                            onMouseLeave={e => {
                                e.stopPropagation();
                                // @ts-ignore Figure out the correct type.
                                e.target.classList.remove("hover");
                            }}
                        />
                    )}
                </ClassNames>
            )}
        </Droppable>
    );
};

export const EditorPageElementsProvider: React.FC = ({ children }) => {
    const pageBuilder = usePageBuilder();

    const DONEEEEE = [
        "document",
        "quote",
        "paragraph",
        "heading",
        "pages-list",
        "list",
        "image",
        "block",
        "grid",
        "cell"
    ];

    const renderers = plugins
        .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
        .reduce((current, item) => {
            if (DONEEEEE.includes(item.elementType)) {
                return { ...current, [item.elementType]: item.render };
            }
            return { ...current, [item.elementType]: item.renderer };
        }, {});

    const modifiers = {
        attributes: {
            id: createId(),
            className: createClassName()
        },
        styles: {
            background: createBackground(),
            border: createBorder(),
            height: createHeight(),
            horizontalAlign: createHorizontalAlign(),
            margin: createMargin(),
            text: createText(),
            textAlign: createTextAlign(),
            padding: createPadding(),
            shadow: createShadow(),
            verticalAlign: createVerticalAlign(),
            visibility: createVisibility(),
            width: createWidth()
        }
    };

    return (
        <PbPageElementsProvider
            // We can assign `Theme` here because we know at this point we're using the new elements rendering engine.
            theme={pageBuilder.theme as Theme}
            renderers={renderers}
            modifiers={modifiers}
            beforeRenderer={EditorControls}
        >
            {children}
        </PbPageElementsProvider>
    );
};
