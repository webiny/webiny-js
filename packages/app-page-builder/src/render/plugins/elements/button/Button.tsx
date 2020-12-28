import React from "react";
import kebabCase from "lodash/kebabCase";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { PbElement } from "@webiny/app-page-builder/types";
import { Link } from "@webiny/react-router";
import { ResponsiveModeContext } from "../../../../contexts/ResponsiveMode";

const Button = ({ element }: { element: PbElement }) => {
    const { editorMode } = React.useContext(ResponsiveModeContext);
    const { type = "default", icon = {}, link = {} } = element.data || {};
    const { svg = null } = icon;
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
            <p>{element.data.buttonText}</p>
        </>
    );

    return (
        <ElementRoot className={"webiny-pb-base-page-element-style"} element={element}>
            {({ getAllClasses, elementStyle, elementAttributes }) => {
                // Use per-device style
                const justifyContent = elementStyle[`--${kebabCase(editorMode)}-justify-content`];

                return (
                    <div style={{ display: "flex", justifyContent }}>
                        <Link
                            to={link.href || "/"}
                            target={link.newTab ? "_blank" : "_self"}
                            style={
                                !link.href
                                    ? { ...elementStyle, pointerEvents: "none" }
                                    : elementStyle
                            }
                            {...elementAttributes}
                            className={getAllClasses(...classes)}
                        >
                            {content}
                        </Link>
                    </div>
                );
            }}
        </ElementRoot>
    );
};

export default Button;
