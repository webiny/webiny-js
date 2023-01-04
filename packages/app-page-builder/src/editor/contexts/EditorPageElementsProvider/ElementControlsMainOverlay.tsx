import React from "react";
import { Element, RendererMeta } from "@webiny/app-page-builder-elements/types";
import styled from "@emotion/styled";
import { CSSObject } from "@emotion/core";
import { useActiveElementId } from "~/editor/hooks/useActiveElementId";
import { useRenderer } from "@webiny/app-page-builder-elements";
import {useRecoilValue} from "recoil";
import {uiAtom} from "~/editor/recoil/modules";

const ACTIVE_COLOR = "var(--mdc-theme-primary)";
const HOVER_COLOR = "var(--mdc-theme-secondary)";

interface Props {
    children?: React.ReactNode;
    innerRef?: React.Ref<any>;
}

export const ElementControlsMainOverlay: React.FC<Props> = props => {
    const { isDragging } = useRecoilValue(uiAtom);
    const [activeElementId, setActiveElementId] = useActiveElementId();

    const { getElement, meta } = useRenderer();
    const element = getElement();

    const isActive = activeElementId === element.id;

    const { children, innerRef, ...rest } = props;

    return (
        <StyledElementControlsMainOverlay
            isDragging={isDragging}
            isActive={isActive}
            element={element}
            elementRendererMeta={meta}
            onClick={() => setActiveElementId(element.id)}
            className={isActive ? "active" : ""}
            onMouseEnter={e => {
                e.stopPropagation();
                const target = e.target as HTMLDivElement;
                target.classList.add("hover");
            }}
            onMouseLeave={e => {
                e.stopPropagation();
                const target = e.target as HTMLDivElement;
                target.classList.remove("hover");
            }}
            ref={innerRef}
            {...rest}
        >
            {children}
        </StyledElementControlsMainOverlay>
    );
};

const StyledElementControlsMainOverlay = styled.div<{
    element: Element;
    elementRendererMeta: RendererMeta;
    isActive: boolean;
    isDragging: boolean;
}>(({ element, elementRendererMeta, isActive, isDragging }) => {
    const margins = elementRendererMeta.calculatedStyles.reduce((current, item) => {
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
            },
            "& + *": {
                zIndex: 5,
                position: "relative"
            }
        });

        if (!isDragging) {
            Object.assign(activeStyles, {
                "& + *": {
                    zIndex: 5,
                    position: "relative"
                }
            });

        }
    }

    return {
        outline: element.type === "cell" ? "1px dashed #757575" : undefined,
        position: "absolute",
        zIndex: 1,
        top: `calc(0px - ${margins.marginTop})`,
        left: 0,
        width: "100%",
        height: `calc(100%  + ${margins.marginTop})`,
        transition: "box-shadow 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)",
        cursor: "pointer",
        ...hoverStyles,
        ...activeStyles
    };
});
