// @flow
import React from "react";
import { css } from "emotion";
import { ElementStyle, getElementStyleProps } from "webiny-app-cms/render/components/ElementStyle";

const center = css({ textAlign: "center" });

const Icon = ({ element }: Object) => {
    const svg = element.data.icon || null;

    if (!svg) {
        return null;
    }

    return (
        <ElementStyle {...getElementStyleProps(element)}>
            {({ getAllClasses, elementStyle }) => (
                <div
                    style={elementStyle}
                    className={getAllClasses(
                        "webiny-cms-base-element-style webiny-cms-element-icon",
                        center
                    )}
                    dangerouslySetInnerHTML={{ __html: svg }}
                />
            )}
        </ElementStyle>
    );
};

export default Icon;
