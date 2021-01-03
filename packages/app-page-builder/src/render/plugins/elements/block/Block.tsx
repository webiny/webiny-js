import React from "react";
import { css } from "emotion";
import kebabCase from "lodash/kebabCase";
import Element from "@webiny/app-page-builder/render/components/Element";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { PbElement } from "@webiny/app-page-builder/types";
import ElementAnimation from "@webiny/app-page-builder/render/components/ElementAnimation";
import { Interpolation } from "@emotion/core";
import { PageBuilderContext, PageBuilderContextValue } from "../../../../contexts/PageBuilder";

const Block = ({ element }: { element: PbElement }) => {
    const {
        responsiveDisplayMode: { displayMode }
    } = React.useContext<PageBuilderContextValue>(PageBuilderContext);
    return (
        <ElementAnimation>
            <ElementRoot element={element}>
                {({ elementStyle, elementAttributes, customClasses, combineClassNames }) => {
                    const containerStyle = elementStyle;
                    // Use per-device style
                    const width = elementStyle[`--${kebabCase(displayMode)}-align-items`];
                    /**
                     * We're swapping "justifyContent" & "alignItems" value here because
                     * ".webiny-pb-layout-block" has "flex-direction: column"
                     */
                    const alignItems = elementStyle[`--${kebabCase(displayMode)}-justify-content`];
                    const justifyContent = elementStyle[`--${kebabCase(displayMode)}-align-items`];

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
                                style={{
                                    width,
                                    justifyContent,
                                    alignItems
                                }}
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
