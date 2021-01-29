import React, { CSSProperties } from "react";
import kebabCase from "lodash/kebabCase";
import styled from "@emotion/styled";
import { css } from "emotion";
import { PbEditorElement, DisplayMode } from "../../../../types";
import Element from "../../../components/Element";

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
    element: PbEditorElement;
    displayMode: DisplayMode;
};
const Grid: React.FunctionComponent<GridPropsType> = ({
    elementStyle,
    elementAttributes,
    customClasses,
    combineClassNames,
    element,
    displayMode
}) => {
    const containerStyle = elementStyle || {};
    // Use per-device style
    const alignItems = elementStyle[`--${kebabCase(displayMode)}-align-items`];
    return (
        <StyledGrid
            className={combineClassNames(
                ...customClasses,
                "webiny-pb-layout-grid-container " + css(containerStyle as any)
            )}
            {...elementAttributes}
            style={{
                alignItems
            }}
        >
            {element.elements.map((child: PbEditorElement) => {
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
