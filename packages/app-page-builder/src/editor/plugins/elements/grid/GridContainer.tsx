import DropZone from "@webiny/app-page-builder/editor/components/DropZone";
import { elementsAtom } from "@webiny/app-page-builder/editor/recoil/modules";
import { css } from "emotion";
import React, { CSSProperties } from "react";
import styled from "@emotion/styled";
import { PbShallowElement } from "@webiny/app-page-builder/types";
import { useRecoilValue } from "recoil";

const StyledGridContainer = styled("div")({
    display: "flex",
    justifyItems: "center",
    alignItems: "center"
});
const StyledGridBlockCell = styled("div")({
    flexGrow: 1,
    padding: "10px"
});

type GridContainerPropsType = {
    combineClassNames: (...classes: string[]) => string;
    elementStyle: CSSProperties;
    elementAttributes: { [key: string]: string };
    customClasses: string[];
    element: PbShallowElement;
};
const GridContainer: React.FunctionComponent<GridContainerPropsType> = props => {
    const { elementStyle, elementAttributes, customClasses, combineClassNames, element } = props;
    const { width, alignItems, justifyContent, ...containerStyle } = elementStyle;
    const elements = useRecoilValue(elementsAtom);
    return (
        <StyledGridContainer
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
            {element.elements.map((id, index) => {
                const child = elements[id];
                const childStyles = {
                    width: child.data?.settings?.width?.value || "auto"
                };
                return (
                    <StyledGridBlockCell key={child.id || `child-${index}`} style={childStyles}>
                        <DropZone.Center
                            id={id}
                            type={element.type}
                            onDrop={source => {
                                return void 0;
                            }}
                        >
                            CELL
                        </DropZone.Center>
                    </StyledGridBlockCell>
                );
            })}
        </StyledGridContainer>
    );
};
export default React.memo(GridContainer);
