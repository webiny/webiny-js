import React, { CSSProperties, useCallback, useMemo } from "react";
import kebabCase from "lodash/kebabCase";
import { plugins } from "@webiny/plugins";
import { ElementRoot } from "../../../components/ElementRoot";
import { PbButtonElementClickHandlerPlugin, PbElement, PbElementDataType } from "~/types";
import { Link } from "@webiny/react-router";
import { PageBuilderContext } from "~/contexts/PageBuilder";

const formatUrl = (url: string): string => {
    // Check if external domain url (e.g. google.com, https://www.google.com)
    const isExternalUrl = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}.*?/gi).test(
        url
    );
    const isStartingWithHttp = url.startsWith("http://") || url.startsWith("https://");

    // If external domain url, but without protocol we add it manually
    if (isExternalUrl && !isStartingWithHttp) {
        url = "https://" + url;
    }

    return url;
};

interface ElementData extends Omit<PbElementDataType, "action"> {
    action?: Partial<PbElementDataType["action"]>;
}

interface ButtonProps {
    element: PbElement;
}
const Button: React.FC<ButtonProps> = ({ element }) => {
    const {
        responsiveDisplayMode: { displayMode }
    } = React.useContext(PageBuilderContext);
    const {
        type = "default",
        icon = {},
        action = {},
        link = {}
    }: ElementData = element.data || ({} as ElementData);
    const { svg = null } = icon;
    const { position = "left" } = icon;

    const plugin = useMemo(
        () => plugins.byName<PbButtonElementClickHandlerPlugin>(action.clickHandler),
        [action.clickHandler]
    );

    // Let's preserve backwards compatibility by extracting "link" properties from deprecated "link"
    // element object, if it exists otherwise, we'll use the newer "action" element object
    let href: string, newTab: boolean;

    // If `link.href` is truthy, assume we're using link, not action.
    if (link?.href && !action.href) {
        href = link?.href;
        newTab = !!link?.newTab;
    } else {
        href = action?.href ? formatUrl(action.href) : "";
        newTab = action.newTab || false;
    }

    const clickHandler: () => void = plugin
        ? () =>
              plugin.handler({
                  variables: action.variables || []
              })
        : () => null;

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

    const scrollIntoView = useCallback(() => {
        if (action.scrollToElement && typeof window !== "undefined") {
            // Get element coordinates to calculate scrollTo position
            const elementBounding =
                window.document.getElementById(action.scrollToElement)?.getBoundingClientRect()
                    ?.top || 0;
            // Scroll to element with fixed offset
            window.scrollTo({
                top: elementBounding - window.document.body.getBoundingClientRect().top - 100
            });
        }
    }, [action.scrollToElement]);

    return (
        <ElementRoot className={"webiny-pb-base-page-element-style"} element={element}>
            {({ getAllClasses, elementStyle, elementAttributes }) => {
                // TODO @ts-refactor div style
                // Use per-device style
                const justifyContent =
                    elementStyle[
                        `--${kebabCase(
                            displayMode
                        )}-justify-content` as unknown as keyof CSSProperties
                    ];
                return (
                    <>
                        {action.actionType === "onClickHandler" && (
                            <div
                                style={{ display: "flex", justifyContent } as any}
                                onClick={clickHandler}
                            >
                                <div
                                    style={elementStyle}
                                    {...elementAttributes}
                                    className={getAllClasses(...classes)}
                                >
                                    {content}
                                </div>
                            </div>
                        )}
                        {action.actionType === "scrollToElement" && (
                            <div
                                style={{ display: "flex", justifyContent } as any}
                                onClick={scrollIntoView}
                            >
                                <div
                                    style={elementStyle}
                                    {...elementAttributes}
                                    className={getAllClasses(...classes)}
                                >
                                    {content}
                                </div>
                            </div>
                        )}
                        {action.actionType !== "onClickHandler" &&
                            action.actionType !== "scrollToElement" && (
                                <div style={{ display: "flex", justifyContent } as any}>
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
