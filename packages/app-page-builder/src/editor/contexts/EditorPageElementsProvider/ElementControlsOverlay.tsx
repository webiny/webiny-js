import React from "react";
import { Element, RendererMeta } from "@webiny/app-page-builder-elements/types";
import styled from "@emotion/styled";
import { CSSObject } from "@emotion/core";
import { useActiveElementId } from "~/editor/hooks/useActiveElementId";
import { useRenderer } from "@webiny/app-page-builder-elements";
import { useRecoilValue } from "recoil";
import { uiAtom } from "~/editor/recoil/modules";

const ACTIVE_COLOR = "var(--mdc-theme-primary)";
const HOVER_COLOR = "var(--mdc-theme-secondary)";

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-element-controls-overlay": React.HTMLProps<HTMLDivElement>
        }
    }
}

interface Props {
    children?: React.ReactNode;
    innerRef?: React.Ref<any>;
}

export const ElementControlsOverlay: React.FC<Props> = props => {
    const { isDragging } = useRecoilValue(uiAtom);
    const [activeElementId, setActiveElementId] = useActiveElementId();

    const { getElement, meta } = useRenderer();
    const element = getElement();

    const isActive = activeElementId === element.id;

    const { children, innerRef, ...rest } = props;

    return (
        <PbElementControlsOverlay
            isDragging={isDragging}
            isActive={isActive}
            element={element}
            elementRendererMeta={meta}
            onClick={() => setActiveElementId(element.id)}
            className={isActive ? "active" : ""}
            onMouseEnter={(e: MouseEvent) => {
                e.stopPropagation();
                const target = e.target as HTMLDivElement;
                target.classList.add("hover");
            }}
            onMouseLeave={(e: MouseEvent) => {
                e.stopPropagation();
                const target = e.target as HTMLDivElement;
                target.classList.remove("hover");
            }}
            ref={innerRef}
            {...rest}
        >
            {children}
        </PbElementControlsOverlay>
    );
};

const PbElementControlsOverlay = styled(
    ({ className, onMouseEnter, onMouseLeave, ref, children }) => {
        return (
            <pb-element-controls-overlay
                // @ts-ignore Not supported by `React.HTMLProps<HTMLDivElement>`.
                class={className}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                ref={ref}
            >
                {children}
            </pb-element-controls-overlay>
        );
    }
)<{
    element: Element;
    elementRendererMeta: RendererMeta;
    isActive: boolean;
    isDragging: boolean;
}>(({ element, elementRendererMeta, isActive, isDragging }) => {
    // By default, the element controls overlay takes the size of the actual element.
    // But, if margins were set, they won't be taken into consideration. The shown
    // overlay is smaller than the actual space the page element takes. That's why,
    // when calculating the size of the overlay, we also need to take into consideration
    // any margins that the user might've set.
    const margins: CSSObject = elementRendererMeta.calculatedStyles.reduce(
        (current, item) => {
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

    const hoverStyles: CSSObject = {
        "&.hover": {
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
        }
    };

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
        outline: element.type === "cell" ? "1px dashed #757575" : undefined,
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
