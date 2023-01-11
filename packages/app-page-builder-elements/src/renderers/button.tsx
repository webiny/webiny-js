import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { LinkComponent } from "~/types";
import styled, { CSSObject } from "@emotion/styled";
import { ClassNames } from "@emotion/core";
import { DefaultLinkComponent } from "~/renderers/components";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

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

const ButtonBody: React.FC<{ className?: string; onClick?: () => void }> = ({
    className,
    children,
    onClick
}) => (
    <ClassNames>
        {({ cx }) => (
            <div className={cx("button-body", className)} onClick={onClick}>
                {children}
            </div>
        )}
    </ClassNames>
);

const ButtonIcon: React.FC<{ className?: string; svg: string }> = ({ className, svg }) => (
    <ClassNames>
        {({ cx }) => (
            <div
                className={cx("button-icon", className)}
                dangerouslySetInnerHTML={{ __html: svg }}
            />
        )}
    </ClassNames>
);

const ButtonText: React.FC<{ text: string }> = ({ text }) => {
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
    };
}

export interface Props {
    buttonText?: string;
    action?: ButtonElementData["action"];
}

export const createButton = (params: CreateButtonParams = {}) => {
    const LinkComponent = params?.linkComponent || DefaultLinkComponent;

    return createRenderer<Props>(
        props => {
            const { getStyles } = usePageElements();
            const { getElement } = useRenderer();
            const element = getElement<ButtonElementData>();
            const { link, icon } = element.data;

            const buttonText = props.buttonText || element.data.buttonText;
            const action = props.action || element.data.action;

            let buttonInnerContent = <ButtonText text={buttonText} />;

            let StyledButtonBody = ButtonBody,
                StyledButtonIcon;

            if (icon && icon.svg) {
                const { position = "left", color } = icon;

                StyledButtonBody = styled(StyledButtonBody)({
                    display: "flex",
                    ...ICON_POSITION_FLEX_DIRECTION[position]
                });

                StyledButtonIcon = styled(ButtonIcon)(
                    {
                        width: icon.width,
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
                        <StyledButtonIcon svg={icon.svg} />
                        {buttonInnerContent}
                    </>
                );
            }

            const linkActions = ["link", "scrollToElement"];
            if (link?.href || linkActions.includes(action?.actionType)) {
                const href = link?.href || action?.href;
                const newTab = link?.newTab || action?.newTab;

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
            }
        }
    );
};
