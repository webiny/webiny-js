import React from "react";
import { get } from "dot-prop-immutable";
import Slate from "@webiny/app-page-builder/render/components/Slate";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { PbElement } from "@webiny/app-page-builder/types";
import { Link } from "@webiny/react-router";

const Button = ({ element }: { element: PbElement }) => {
    const { type = "default", icon = {}, link = {} } = element.data || {};
    const { svg = null } = icon;
    const alignItems = get(element, "data.settings.horizontalAlignFlex") || "flex-start";
    const { position = "left" } = icon;

    const classes = [
        "webiny-pb-base-page-element-style",
        "webiny-pb-page-element-button",
        "webiny-pb-page-element-button--" + type,
        "webiny-pb-page-element-button__icon--" + position
    ];

    const content = (
        <>
            {svg && <span dangerouslySetInnerHTML={{ __html: svg }} />}
            <Slate value={element.data.text} />
        </>
    );

    return (
        <ElementRoot element={element}>
            {({ getAllClasses, elementStyle, elementAttributes }) => (
                <div
                    style={{ ...elementStyle, display: "flex", justifyContent: alignItems }}
                    {...elementAttributes}
                >
                    {link.href ? (
                        <Link
                            to={link.href}
                            target={link.newTab ? "_blank" : "_self"}
                            className={getAllClasses(...classes)}
                        >
                            {content}
                        </Link>
                    ) : (
                        <a
                            target={link.newTab ? "_blank" : "_self"}
                            className={getAllClasses(...classes)}
                        >
                            {content}
                        </a>
                    )}
                </div>
            )}
        </ElementRoot>
    );
};

export default Button;
