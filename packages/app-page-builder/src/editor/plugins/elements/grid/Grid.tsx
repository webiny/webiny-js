import React, { CSSProperties } from "react";
import styled from "@emotion/styled";
import Element from "@webiny/app-page-builder/editor/components/Element";
import { css } from "emotion";
import { PbElement } from "@webiny/app-page-builder/types";

const StyledGrid = styled("div")({
    display: "flex",
    justifyItems: "center",
    alignItems: "center",
    flexDirection: "row"
});
const CellContainer = styled("div")(({ size }: any) => ({
    width: `${(100 / 12) * size}%`
}));
type GridPropsType = {
    combineClassNames: (...classes: string[]) => string;
    elementStyle: CSSProperties;
    elementAttributes: { [key: string]: string };
    customClasses: string[];
    element: PbElement;
};
const Grid: React.FunctionComponent<GridPropsType> = ({
    elementStyle,
    elementAttributes,
    customClasses,
    combineClassNames,
    element
}) => {
    const { width, alignItems, justifyContent, ...containerStyle } = elementStyle || {};

    return (
        <StyledGrid
            className={combineClassNames(
                ...customClasses,
                "webiny-pb-layout-grid-container " + css(containerStyle as any)
            )}
            {...elementAttributes}
            style={{
                width: width ? width : "100%",
                alignSelf: justifyContent,
                alignItems: alignItems
            }}
        >
            {element.elements.map(child => {
                return (
                    <CellContainer size={child.data.settings?.grid?.size} key={`cell-${child.id}`}>
                        <Element id={child.id} />
                    </CellContainer>
                );
            })}
        </StyledGrid>
    );
};
export default React.memo(Grid);
