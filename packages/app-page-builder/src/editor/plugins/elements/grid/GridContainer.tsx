import React, { CSSProperties } from "react";
import { useRecoilValue } from "recoil";
import kebabCase from "lodash/kebabCase";
import styled from "@emotion/styled";
import { PbEditorElement } from "~/types";
import { ElementRoot } from "~/render/components/ElementRoot";
import Grid from "./PbGrid";
import ElementAnimation from "~/render/components/ElementAnimation";
import { elementWithChildrenByIdSelector, uiAtom } from "~/editor/recoil/modules";

const GridContainerStyle = styled("div")({
    position: "relative",
    color: "#666",
    boxSizing: "border-box",
    display: "flex"
});

interface GridContainerPropsType {
    element: PbEditorElement;
}
const GridContainer: React.FC<GridContainerPropsType> = ({ element: { id } }) => {
    const element = useRecoilValue(elementWithChildrenByIdSelector(id));
    const { displayMode } = useRecoilValue(uiAtom);
    // TODO remove when state is fully switched to use content instead of flat elements
    if (!element) {
        return null;
    }
    return (
        <ElementAnimation>
            <ElementRoot element={element}>
                {({ elementStyle, elementAttributes, customClasses, combineClassNames }) => {
                    // Use per-device style
                    const justifyContent =
                        elementStyle[
                            `--${kebabCase(
                                displayMode
                            )}-justify-content` as unknown as keyof CSSProperties
                        ];
                    /**
                     * Figure out better type
                     */
                    // TODO @ts-refactor
                    const style: CSSProperties = {
                        justifyContent: justifyContent as any
                    };
                    return (
                        <GridContainerStyle id={id} style={style}>
                            <Grid
                                element={element}
                                elementStyle={elementStyle}
                                elementAttributes={elementAttributes}
                                customClasses={[
                                    "webiny-pb-layout-grid webiny-pb-base-page-element-style",
                                    ...customClasses
                                ]}
                                combineClassNames={combineClassNames}
                                displayMode={displayMode}
                            />
                        </GridContainerStyle>
                    );
                }}
            </ElementRoot>
        </ElementAnimation>
    );
};

const MemoizedGridContainer = React.memo(GridContainer, (current, next) => {
    return current.element.id === next.element.id;
});

MemoizedGridContainer.displayName = "MemoizedGridContainer";
export default MemoizedGridContainer;
