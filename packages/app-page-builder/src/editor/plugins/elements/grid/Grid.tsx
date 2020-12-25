import React, { CSSProperties } from "react";
import kebabCase from "lodash/kebabCase";
import styled from "@emotion/styled";
import { css } from "emotion";
import { PbElement } from "../../../../types";
import Element from "../../../components/Element";
import { EditorMode } from "../../../recoil/modules";

const StyledGrid = styled("div")({
    display: "flex",
    justifyItems: "center",
    alignItems: "center",
    flexDirection: "row"
});
const CELL_CLASSNAME = "webiny-pb-layout-grid-cell";

type GridPropsType = {
    combineClassNames: (...classes: string[]) => string;
    elementStyle: CSSProperties;
    elementAttributes: { [key: string]: string };
    customClasses: string[];
    element: PbElement;
    editorMode: EditorMode;
};
const Grid: React.FunctionComponent<GridPropsType> = ({
    elementStyle,
    elementAttributes,
    customClasses,
    combineClassNames,
    element,
    editorMode
}) => {
    const { width, ...containerStyle } = elementStyle || {};
    // Use per-device style
    const alignItems = elementStyle[`--${kebabCase(editorMode)}-align-items`];
    return (
        <StyledGrid
            className={combineClassNames(
                ...customClasses,
                "webiny-pb-layout-grid-container " + css(containerStyle as any)
            )}
            {...elementAttributes}
            style={{
                width: width ? width : "100%",
                alignItems
            }}
        >
            {element.elements.map(child => {
                return (
                    <div
                        key={`cell-${child.id}`}
                        className={`${CELL_CLASSNAME} ${CELL_CLASSNAME}-${child.data.settings?.grid?.size}`}
                    >
                        <Element id={child.id} />
                    </div>
                );
            })}
        </StyledGrid>
    );
};
export default React.memo(Grid);
