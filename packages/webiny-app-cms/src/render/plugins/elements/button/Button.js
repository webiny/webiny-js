import React from "react";
import { get } from "dot-prop-immutable";
import Slate from "webiny-app-cms/render/components/Slate";
import ElementStyle from "webiny-app-cms/render/components/ElementStyle";
import type { ElementType } from "webiny-app-cms/types";

const Button = ({ element }: ElementType) => {
    const { type = "default" } = get(element, "settings.advanced") || {};

    return (
        <ElementStyle element={element}>
            {({ getAllClasses }) => (
                <button className={getAllClasses("webiny-cms-element-button", type)}>
                    <Slate value={element.data.text} />
                </button>
            )}
        </ElementStyle>
    );
};

export default Button;
