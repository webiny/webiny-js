//@flow
import React from "react";
import { css } from "emotion";
import Element from "webiny-app-cms/render/components/Element";
import { ElementStyle, getElementStyleProps } from "webiny-app-cms/render/components/ElementStyle";
import type { ElementType } from "webiny-app-cms/types";

const Block = ({ element }: { element: ElementType }) => {
    return (
        <ElementStyle
            style={{ margin: "0 auto", boxSizing: "border-box" }}
            {...getElementStyleProps(element)}
        >
            {({ elementStyle, customClasses, combineClassNames }) => {
                const { width, ...containerStyle } = elementStyle;
                return (
                    <div
                        data-aos="fade-up"
                        className={"webiny-cms-layout-block " + css(containerStyle)}
                    >
                        <div
                            style={{ width, margin: "0 auto" }}
                            className={
                                "webiny-cms-layout-block__wrapper " +
                                combineClassNames(...customClasses)
                            }
                        >
                            {element.elements.map(element => (
                                <Element key={element.id} element={element} />
                            ))}
                        </div>
                    </div>
                );
            }}
        </ElementStyle>
    );
};

export default Block;
