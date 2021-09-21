import React from "react";
import { css } from "@emotion/css";
import kebabCase from "lodash/kebabCase";
import { ElementChildren } from "~/components/Element";
import { ElementRoot } from "~/components/ElementRoot";
import { PageElement } from "~/types";
import ElementAnimation from "~/components/ElementAnimation";
import { Interpolation } from "@emotion/core";
import { usePageElements } from "~/hooks/usePageElements";

const Block = ({ element }: { element: PageElement }) => {
    const {
        responsiveDisplayMode: { displayMode }
    } = usePageElements();

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
                                <ElementChildren element={element} />
                            </div>
                        </div>
                    );
                }}
            </ElementRoot>
        </ElementAnimation>
    );
};

export default Block;
