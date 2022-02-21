import React, { CSSProperties } from "react";
import { css } from "emotion";
import kebabCase from "lodash/kebabCase";
import Element from "../../../components/Element";
import { ElementRoot } from "../../../components/ElementRoot";
import { PbElement } from "~/types";
import ElementAnimation from "../../../components/ElementAnimation";
import { Interpolation } from "@emotion/core";
import { PageBuilderContext, PageBuilderContextValue } from "../../../../contexts/PageBuilder";

interface BlockProps {
    element: PbElement;
}
const Block: React.FC<BlockProps> = ({ element }) => {
    const {
        responsiveDisplayMode: { displayMode }
    } = React.useContext<PageBuilderContextValue>(PageBuilderContext);
    return (
        <ElementAnimation>
            <ElementRoot element={element}>
                {({ elementStyle, elementAttributes, customClasses, combineClassNames }) => {
                    const containerStyle = elementStyle;
                    // Use per-device style
                    const width =
                        elementStyle[
                            `--${kebabCase(displayMode)}-align-items` as keyof CSSProperties
                        ];
                    /**
                     * We're swapping "justifyContent" & "alignItems" value here because
                     * ".webiny-pb-layout-block" has "flex-direction: column"
                     */
                    const alignItems =
                        elementStyle[
                            `--${kebabCase(displayMode)}-justify-content` as keyof CSSProperties
                        ];
                    const justifyContent =
                        elementStyle[
                            `--${kebabCase(displayMode)}-align-items` as keyof CSSProperties
                        ];

                    // TODO @ts-refactor style type
                    return (
                        <div
                            style={{ width: "100%", display: "flex" }}
                            className={
                                "webiny-pb-layout-block-container " +
                                css(containerStyle as Interpolation)
                            }
                            {...elementAttributes}
                        >
                            <div
                                style={
                                    {
                                        width,
                                        justifyContent,
                                        alignItems
                                    } as any
                                }
                                className={combineClassNames(
                                    "webiny-pb-layout-block webiny-pb-base-page-element-style",
                                    ...customClasses
                                )}
                            >
                                {element.elements.map(element => (
                                    <Element key={element.id} element={element} />
                                ))}
                            </div>
                        </div>
                    );
                }}
            </ElementRoot>
        </ElementAnimation>
    );
};

export default Block;
