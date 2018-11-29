import React from "react";
import { css } from "emotion";
import { ElementStyle, getElementStyleProps } from "webiny-app-cms/render/components/ElementStyle";

const center = css({ textAlign: "center" });

const Icon = ({ theme, element }) => {
    const svg = element.data.icon || null;

    if (!svg) {
        return null;
    }

    return (
        <ElementStyle {...getElementStyleProps(element)}>
            {({ getAllClasses }) => (
                <div
                    className={getAllClasses("webiny-cms-element-icon", center)}
                    dangerouslySetInnerHTML={{ __html: svg }}
                />
            )}
        </ElementStyle>
    );
};

export default Icon;
