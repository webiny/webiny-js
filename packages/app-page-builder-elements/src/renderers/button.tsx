import React, { useMemo } from "react";
import styled, { CSSObject } from "@emotion/styled";
import { ClassNames } from "@emotion/react";
import { makeDecoratable } from "@webiny/react-composition";
import { usePageElements } from "~/hooks/usePageElements";
import { LinkComponent, Element } from "~/types";
import { DefaultLinkComponent } from "~/renderers/components";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { ElementAttribute } from "~/attributes/ElementAttribute";

const ICON_POSITION_FLEX_DIRECTION: Record<string, CSSObject> = {
    right: { flexDirection: "row-reverse" },
    bottom: { flexDirection: "column-reverse" },
    top: { flexDirection: "column" },
    left: { flexDirection: "row" }
};

const ICON_POSITION_MARGIN: Record<string, CSSObject> = {
    right: { marginLeft: 5 },
    bottom: { marginTop: 5 },
    top: { marginBottom: 5 },
    left: { marginRight: 5 }
};

export interface ButtonClickHandler {
    id: string;
    name: string;
    handler: (params: { variables: Record<string, any> }) => void | Promise<void>;
    variables?: Array<{
        name: string;
        label: string;
        defaultValue: any;
    }>;
}

export interface CreateButtonParams {
    linkComponent?: LinkComponent;
    clickHandlers?: Array<ButtonClickHandler> | (() => Array<ButtonClickHandler>);
}

interface ButtonBodyProps {
    className?: string;
    children?: React.ReactNode;
    onClick?: () => void;
}

const ButtonBody = ({ className, children, onClick }: ButtonBodyProps) => (
    <ClassNames>
        {({ cx }) => (
            <div className={cx("button-body", className)} onClick={onClick}>
                {children}
            </div>
        )}
    </ClassNames>
);

interface ButtonIconProps {
    className?: string;
    svg: string;
}

const ButtonIcon = ({ className, svg }: ButtonIconProps) => (
    <ClassNames>
        {({ cx }) => (
            <div
                className={cx("button-icon", className)}
                dangerouslySetInnerHTML={{ __html: svg }}
            />
        )}
    </ClassNames>
);

interface ButtonTextProps {
    text: string;
}

const ButtonText = ({ text }: ButtonTextProps) => {
    return <div className={"button-text"}>{text}</div>;
};

export type ButtonRenderer = ReturnType<typeof createButton>;

export interface ButtonElementData {
    buttonText: string;
    link: {
        newTab: boolean;
        href: string;
    };
    icon: { position: string; color: string; svg: string; width: string };
    action: {
        actionType: "link" | "scrollToElement" | "onClickHandler";
        newTab: boolean;
        href: string;
        clickHandler?: string;
        variables?: Record<string, any>;
        scrollToElement?: string;
    };
}

export interface Props {
    buttonText?: string;
    action?: ButtonElementData["action"];
}

const isButtonElement = (element: Element): element is Element<ButtonElementData> => {
    return "buttonText" in element.data;
};

export const getValueFromElement = (element: Element) => {
    if (isButtonElement(element)) {
        return element.data.buttonText;
    }
    return null;
};

const attributes = {
    buttonText: new ElementAttribute<string>({
        name: "buttonText",
        getValue: (element: Element<ButtonElementData>) => {
            return element.data.buttonText;
        }
    }),
    iconPosition: new ElementAttribute<string>({
        name: "iconPosition",
        getValue: (element: Element<ButtonElementData>) => {
            return element.data.icon?.position;
        }
    }),
    iconColor: new ElementAttribute<string>({
        name: "iconColor",
        getValue: (element: Element<ButtonElementData>) => {
            return element.data.icon?.color;
        }
    }),
    iconSvg: new ElementAttribute<string>({
        name: "iconSvg",
        getValue: (element: Element<ButtonElementData>) => {
            return element.data.icon?.svg;
        }
    }),
    iconWidth: new ElementAttribute<string>({
        name: "iconWidth",
        getValue: (element: Element<ButtonElementData>) => {
            return element.data.icon?.width;
        }
    }),
    actionType: new ElementAttribute<ButtonElementData["action"]["actionType"]>({
        name: "actionType",
        getValue: (element: Element<ButtonElementData>) => {
            return element.data.action?.actionType;
        }
    }),
    actionNewTab: new ElementAttribute<ButtonElementData["action"]["newTab"]>({
        name: "actionNewTab",
        getValue: (element: Element<ButtonElementData>) => {
            return element.data.action?.newTab;
        }
    }),
    actionHref: new ElementAttribute<ButtonElementData["action"]["href"]>({
        name: "actionHref",
        getValue: (element: Element<ButtonElementData>) => {
            return element.data.action?.href;
        }
    })
};

type GetInputValues<T> = { [K in keyof T]?: T[K] extends ElementAttribute<infer P> ? P : never };

export const createButton = (params: CreateButtonParams = {}) => {
    const LinkComponent = params?.linkComponent || DefaultLinkComponent;

    const Renderer = createRenderer<Props, typeof attributes>(
        props => {
            const { getStyles } = usePageElements();
            const { getElement, inputs: untypedInputs } = useRenderer();
            const element = getElement<ButtonElementData>();
            const { link } = element.data;

            const inputs = untypedInputs as GetInputValues<typeof attributes>;

            const buttonText = inputs.buttonText || props.buttonText || "";
            let buttonInnerContent = <ButtonText text={buttonText} />;

            const action: ButtonElementData["action"] = {
                href: inputs.actionHref || "",
                newTab: inputs.actionNewTab || false,
                actionType: inputs.actionType || "link"
            };

            let StyledButtonBody = ButtonBody,
                StyledButtonIcon;

            if (inputs.iconSvg) {
                const position = inputs.iconPosition || "left";
                const color = inputs.iconColor || "#000";

                StyledButtonBody = styled(StyledButtonBody)({
                    display: "flex",
                    ...ICON_POSITION_FLEX_DIRECTION[position]
                }) as (props: ButtonBodyProps) => JSX.Element;

                StyledButtonIcon = styled(ButtonIcon)(
                    {
                        width: inputs.iconWidth,
                        ...ICON_POSITION_MARGIN[position]
                    },
                    getStyles(theme => {
                        const themeColor = theme.styles.colors?.[color];
                        return {
                            color: themeColor || color
                        };
                    })
                );

                buttonInnerContent = (
                    <>
                        <StyledButtonIcon
                            svg={inputs.iconSvg}
                            className={`button-icon-${position}`}
                        />
                        {buttonInnerContent}
                    </>
                );
            }

            // The `link` property is a legacy property, and it's not used anymore,
            // but we still need to support it in order to not break existing pages.
            const isLinkAction = useMemo(() => {
                return link?.href || ["link", "scrollToElement"].includes(action?.actionType);
            }, [link?.href, action?.actionType]);

            if (isLinkAction) {
                let href = "";

                // In case the `action.actionType` is `scrollToElement`, the flag will remain false.
                let newTab = false;

                if (link?.href) {
                    href = link.href;
                    newTab = link?.newTab;
                } else {
                    if (action.actionType === "link") {
                        href = action.href;
                        newTab = action.newTab;
                    }

                    if (action.actionType === "scrollToElement") {
                        href = "#" + action.scrollToElement;
                    }
                }

                return (
                    <LinkComponent href={href} target={newTab ? "_blank" : "_self"}>
                        <StyledButtonBody>{buttonInnerContent}</StyledButtonBody>
                    </LinkComponent>
                );
            }

            let clickHandler: ButtonClickHandler["handler"] | undefined;
            if (action?.clickHandler) {
                let clickHandlers: Array<ButtonClickHandler> = [];
                if (params?.clickHandlers) {
                    if (typeof params.clickHandlers === "function") {
                        clickHandlers = params.clickHandlers();
                    } else {
                        clickHandlers = params.clickHandlers;
                    }
                }

                clickHandler = clickHandlers?.find(
                    item => item.id === action?.clickHandler
                )?.handler;
            }

            return (
                <StyledButtonBody
                    onClick={() => clickHandler?.({ variables: element.data.action.variables! })}
                >
                    {buttonInnerContent}
                </StyledButtonBody>
            );
        },
        {
            themeStyles({ theme, element }) {
                const { type } = element.data;
                return theme.styles.elements?.button[type];
            },
            propsAreEqual: (prevProps: Props, nextProps: Props) => {
                return (
                    prevProps.buttonText === nextProps.buttonText &&
                    prevProps.action === nextProps.action
                );
            },
            attributes
        }
    );

    return makeDecoratable("ButtonElement", Renderer);
};
