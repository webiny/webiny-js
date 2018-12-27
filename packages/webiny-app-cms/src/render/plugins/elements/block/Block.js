//@flow
import React from "react";
import { css } from "emotion";
import Element from "webiny-app-cms/render/components/Element";
import {
    ElementStyle,
    getElementStyleProps,
    getElementAttributeProps
} from "webiny-app-cms/render/components/ElementStyle";
import type { ElementType } from "webiny-app-cms/types";
import ElementAnimation from "webiny-app-cms/render/components/ElementAnimation";

const Block = ({ element }: { element: ElementType }) => {
    return (
        <ElementAnimation>
            <ElementStyle {...getElementStyleProps(element)} {...getElementAttributeProps(element)}>
                {({ elementStyle, elementAttributes, customClasses, combineClassNames }) => {
                    const { width, alignItems, ...containerStyle } = elementStyle;

                    return (
                        <div
                            style={{ width: "100%", display: "flex", justifyContent: "center" }}
                            className={css(containerStyle)}
                            {...elementAttributes}
                        >
                            <div
                                style={{
                                    width: width ? width : "100%",
                                    alignSelf: "center",
                                    alignItems: alignItems
                                }}
                                className={combineClassNames(
                                    "webiny-cms-layout-block webiny-cms-base-element-style",
                                    ...customClasses
                                )}
                            >
                                {element.elements.map(element => (
                                    /* $FlowFixMe */
                                    <Element key={element.id} element={element} />
                                ))}
                            </div>
                        </div>
                    );
                }}
            </ElementStyle>
        </ElementAnimation>
    );
};

export default Block;
