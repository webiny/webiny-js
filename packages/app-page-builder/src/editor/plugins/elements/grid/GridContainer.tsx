import React, { CSSProperties } from "react";
import DropZone from "@webiny/app-page-builder/editor/components/DropZone";
import styled from "@emotion/styled";
import { DropElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { css } from "emotion";
import { PbElement } from "@webiny/app-page-builder/types";

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
    element: PbElement;
};
const GridContainer: React.FunctionComponent<GridContainerPropsType> = props => {
    const { elementStyle, elementAttributes, customClasses, combineClassNames, element } = props;
    const { width, alignItems, justifyContent, ...containerStyle } = elementStyle;

    const onDrop = (source, child: PbElement) => {
        const { id, path, type } = child;
        new DropElementActionEvent({
            source: element,
            target: {
                id,
                path,
                type,
                position: null
            }
        });
    };
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
            {element.elements.map((child, index) => {
                const childStyles = {
                    width: child.data?.settings?.width?.value || "auto"
                };
                return (
                    <StyledGridBlockCell key={child.id || `child-${index}`} style={childStyles}>
                        <DropZone.Center
                            id={child.id}
                            type={child.type}
                            onDrop={source => onDrop(source, child)}
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
