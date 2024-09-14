import React, { useMemo } from "react";
import styled, { CSSObject } from "@emotion/styled";
import { ClassNames } from "@emotion/react";
import isEqual from "lodash/isEqual";
import { usePageElements } from "~/hooks/usePageElements";
import { LinkComponent } from "~/types";
import { DefaultLinkComponent } from "~/renderers/components";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { ElementInput } from "~/inputs/ElementInput";

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
    linkComponent?: LinkComponent;
    clickHandlers?: Array<ButtonClickHandler>;
}

export const elementInputs = {
    buttonText: ElementInput.create<string, ButtonElementData>({
        name: "buttonText",
        translatable: true,
        type: "text",
        getDefaultValue: ({ element }) => {
            return element.data.buttonText;
        }
    }),
    iconPosition: ElementInput.create<string, ButtonElementData>({
        name: "iconPosition",
        type: "text",
        getDefaultValue: ({ element }) => {
            return element.data.icon?.position;
        }
    }),
    iconColor: ElementInput.create<string, ButtonElementData>({
        name: "iconColor",
        type: "color",
        getDefaultValue: ({ element }) => {
            return element.data.icon?.color;
        }
    }),
    iconSvg: ElementInput.create<string, ButtonElementData>({
        name: "iconSvg",
        type: "svgIcon",
        getDefaultValue: ({ element }) => {
            return element.data.icon?.svg;
        }
    }),
    iconWidth: ElementInput.create<string, ButtonElementData>({
        name: "iconWidth",
        type: "number",
        getDefaultValue: ({ element }) => {
            return element.data.icon?.width;
        }
    }),
    actionType: ElementInput.create<ButtonElementData["action"]["actionType"]>({
        name: "actionType",
        type: "text",
        getDefaultValue: ({ element }) => {
            return element.data.action?.actionType;
        }
    }),
    actionNewTab: ElementInput.create<ButtonElementData["action"]["newTab"]>({
        name: "actionNewTab",
        type: "boolean",
        getDefaultValue: ({ element }) => {
            return element.data.action?.newTab;
        }
    }),
    actionHref: ElementInput.create<ButtonElementData["action"]["href"]>({
        name: "actionHref",
        type: "link",
        translatable: true,
        getDefaultValue: ({ element }) => {
            return element.data.action?.href;
        }
    })
};

export const ButtonRenderer = createRenderer<Props, typeof elementInputs>(
    props => {
        const LinkComponent = props.linkComponent || DefaultLinkComponent;
        const { getStyles } = usePageElements();
        const { getElement, getInputValues } = useRenderer();
        const element = getElement<ButtonElementData>();
        const inputs = getInputValues<typeof elementInputs>();
        const { link } = element.data;

        const buttonText = inputs.buttonText || "";
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
                    <StyledButtonIcon svg={inputs.iconSvg} className={`button-icon-${position}`} />
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

        if (action?.clickHandler) {
            const clickHandler = props.clickHandlers?.find(
                item => item.id === action?.clickHandler
            );

            const onClick = clickHandler
                ? () => clickHandler.handler({ variables: element.data.action.variables! })
                : () => void 0;

            return <StyledButtonBody onClick={onClick}>{buttonInnerContent}</StyledButtonBody>;
        }

        return <StyledButtonBody>{buttonInnerContent}</StyledButtonBody>;
    },
    {
        themeStyles({ theme, element }) {
            const { type } = element.data;
            return theme.styles.elements?.button[type];
        },
        propsAreEqual: (prevProps, nextProps) => {
            return isEqual(prevProps.inputs, nextProps.inputs);
        },
        inputs: elementInputs
    }
);
