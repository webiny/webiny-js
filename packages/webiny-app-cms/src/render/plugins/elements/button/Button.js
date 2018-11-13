import React from "react";
import { get } from "dot-prop-immutable";
import Slate from "webiny-app-cms/render/components/Slate";
import ElementStyle from "webiny-app-cms/render/components/ElementStyle";
import type { ElementType } from "webiny-app-cms/types";

const Button = ({ element }: ElementType) => {
    const { type = "default", icon = {} } = get(element, "settings.advanced") || {};
    const svg = element.data.icon || null;
    // TODO: @sven render according to icon position
    const { position = "left" } = icon;

    return (
        <ElementStyle element={element}>
            {({ getAllClasses }) => (
                <button className={getAllClasses("webiny-cms-element-button", type)}>
                    {svg && <span dangerouslySetInnerHTML={{ __html: svg }} />}
                    <Slate value={element.data.text} />
                </button>
            )}
        </ElementStyle>
    );
};

export default Button;
