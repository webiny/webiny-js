import React, { CSSProperties } from "react";
import kebabCase from "lodash/kebabCase";
import styled from "@emotion/styled";
import { css } from "emotion";
import { PbEditorElement, DisplayMode } from "~/types";
import Element from "~/editor/components/Element";

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
const Grid: React.FC<GridPropsType> = ({
    elementStyle,
    elementAttributes,
    customClasses,
    combineClassNames,
    element,
    displayMode
}) => {
    const containerStyle = elementStyle || {};
    // Use per-device style
    const alignItems =
        elementStyle[`--${kebabCase(displayMode)}-align-items` as unknown as keyof CSSProperties];
    /**
     * Figure out better types.
     */
    // TODO @ts-refactor
    const gridStyles: any = {
        alignItems,
        /**
         * The "max-width" property is being assigned to "Grid" element from grid's width setting value,
         * which works fine for the page preview and website application.
         * But, not in page editor, because, inside page editor the wrapper component is responsible
         * for setting up the "width" due to current design choices.
         * So, here we're overriding this property value so that it'll look identical to website and
         * don't confuse the user.
         */
        maxWidth: "100%"
    };
    return (
        <StyledGrid
            className={combineClassNames(
                ...customClasses,
                "webiny-pb-layout-grid-container " + css(containerStyle as any)
            )}
            {...elementAttributes}
            style={gridStyles}
            data-testid={"grid-section"}
        >
            {(element.elements as PbEditorElement[]).map(child => {
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
