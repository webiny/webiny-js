// @flow
import React from "react";
import { get } from "dot-prop-immutable";
import Slate from "webiny-app-cms/render/components/Slate";
import { ElementRoot } from "webiny-app-cms/render/components/ElementRoot";
import type { ElementType } from "webiny-app-cms/types";

const Button = ({ element }: { element: ElementType }) => {
    const { type = "default", icon = {}, link = {} } = element.data || {};
    const { svg = null } = icon;
    const alignItems = get(element, "data.settings.horizontalAlignFlex") || "flex-start";

    const { position = "left" } = icon;

    return (
        <ElementRoot element={element}>
            {({ getAllClasses, elementStyle, elementAttributes }) => (
                <div
                    style={{ ...elementStyle, display: "flex", justifyContent: alignItems }}
                    {...elementAttributes}
                >
                    <a
                        href={link.href || null}
                        target={link.newTab ? "_blank" : "_self"}
                        className={getAllClasses(
                            "webiny-cms-base-element-style",
                            "webiny-cms-element-button",
                            "webiny-cms-element-button--" + type,
                            "webiny-cms-element-button__icon--" + position
                        )}
                    >
                        {svg && <span dangerouslySetInnerHTML={{ __html: svg }} />}
                        <Slate value={element.data.text} />
                    </a>
                </div>
            )}
        </ElementRoot>
    );
};

export default Button;
