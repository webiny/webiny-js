import React from "react";
import { get } from "dot-prop-immutable";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { PbElement } from "@webiny/app-page-builder/types";
import { Link } from "@webiny/react-router";
import TextRenderer from "../RichTextEditorOutputRenderer";

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
            <TextRenderer data={element.data.text} />
        </>
    );

    return (
        <ElementRoot element={element}>
            {({ getAllClasses, elementStyle, elementAttributes }) => (
                <div
                    style={{ ...elementStyle, display: "flex", justifyContent: alignItems }}
                    {...elementAttributes}
                >
                    <Link
                        to={link.href || null}
                        target={link.newTab ? "_blank" : "_self"}
                        className={getAllClasses(...classes)}
                    >
                        {content}
                    </Link>
                </div>
            )}
        </ElementRoot>
    );
};

export default Button;
