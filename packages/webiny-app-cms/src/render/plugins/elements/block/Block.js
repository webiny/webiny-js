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
            <ElementStyle
                style={{ margin: "0 auto", boxSizing: "border-box" }}
                {...getElementStyleProps(element)}
                {...getElementAttributeProps(element)}
            >
                {({ elementStyle, elementAttributes, customClasses, combineClassNames }) => {
                    const { width, ...containerStyle } = elementStyle;
                    return (
                        <div
                            className={"webiny-cms-layout-block " + css(containerStyle)}
                            {...elementAttributes}
                        >
                            <div
                                style={{ width, margin: "0 auto" }}
                                className={
                                    "webiny-cms-layout-block__wrapper " +
                                    combineClassNames(...customClasses)
                                }
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
