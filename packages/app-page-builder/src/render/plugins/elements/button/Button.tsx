import React from "react";
import kebabCase from "lodash/kebabCase";
import { plugins } from "@webiny/plugins";
import { ElementRoot } from "../../../components/ElementRoot";
import { PbElement } from "../../../../types";
import { Link } from "@webiny/react-router";
import { PageBuilderContext, PageBuilderContextValue } from "../../../../contexts/PageBuilder";

const Button = ({ element }: { element: PbElement }) => {
    const {
        responsiveDisplayMode: { displayMode }
    } = React.useContext<PageBuilderContextValue>(PageBuilderContext);
    const { type = "default", icon = {}, action = {}, link = {} } = element.data || {};
    const { svg = null } = icon;
    const { position = "left" } = icon;

    const plugin = plugins.byName(action.clickHandler);

    let href: string, newTab: boolean;

    if (link && !action) {
        href = link.href;
        newTab = link.newTab;
    } else {
        href = action.href;
        newTab = action.newTab;
    }

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
                const justifyContent = elementStyle[`--${kebabCase(displayMode)}-justify-content`];

                return (
                    <>
                        {action.actionType === "onClickHandler" ? (
                            <div
                                style={{ display: "flex", justifyContent }}
                                onClick={() => plugin.handler(action.parameters)}
                            >
                                <div
                                    style={elementStyle}
                                    {...elementAttributes}
                                    className={getAllClasses(...classes)}
                                >
                                    {content}
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: "flex", justifyContent }}>
                                <Link
                                    to={href || "/"}
                                    target={newTab ? "_blank" : "_self"}
                                    style={
                                        !href
                                            ? { ...elementStyle, pointerEvents: "none" }
                                            : elementStyle
                                    }
                                    {...elementAttributes}
                                    className={getAllClasses(...classes)}
                                >
                                    {content}
                                </Link>
                            </div>
                        )}
                    </>
                );
            }}
        </ElementRoot>
    );
};

export default Button;
