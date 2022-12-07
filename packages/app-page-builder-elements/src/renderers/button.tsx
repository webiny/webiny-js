import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer, Element, LinkComponent, ElementRendererProps } from "~/types";
import styled, { CSSObject } from "@emotion/styled";
import { DefaultLinkComponent } from "~/renderers/components";
import { elementDataPropsAreEqual } from "~/utils";

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-button": any;
            "pb-button-body": any;
            "pb-button-icon": any;
            "pb-button-text": any;
        }
    }
}

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
    clickHandlers?: Array<ButtonClickHandler>;
}

const PbButton: React.FC<{ className?: string; element: Element }> = ({
    className,
    children,
    element
}) => (
    <pb-button data-pe-id={element.id} class={className}>
        {children}
    </pb-button>
);

const PbButtonBody: React.FC<{ className?: string; onClick?: ButtonClickHandler["handler"] }> = ({
    className,
    children,
    onClick
}) => (
    <pb-button-body class={className} onClick={onClick}>
        {children}
    </pb-button-body>
);

const PbButtonIcon: React.FC<{ className?: string; svg: string }> = ({ className, svg }) => (
    <pb-button-icon class={className} dangerouslySetInnerHTML={{ __html: svg }} />
);

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

export interface ButtonElementData {
    buttonText: string;
    type: string;
    action: {
        actionType: "link" | "clickHandler" | "scrollToElement";
        href?: string;
        newTab?: boolean;
        clickHandler: string;
        scrollToElement: string;
        variables: string;
    };
    link?: {
        href?: string;
        newTab?: boolean;
    };
    icon?: {
        color: string;
        svg: string;
        id: Array<string>;
        width: number;
        position: string;
    };
}

export interface ButtonElementRendererProps extends ElementRendererProps {
    element: Element<ButtonElementData>;
}

export type ButtonElementRenderer = ReturnType<typeof createButton>;

export const createButton = (params: CreateButtonParams = {}) => {
    const LinkComponent = params?.linkComponent || DefaultLinkComponent;
    const clickHandlers = params?.clickHandlers || [];

    const Button: ElementRenderer<ButtonElementRendererProps> = ({ element }) => {
        const { buttonText, link, type, icon, action } = element.data;
        const { getElementStyles, getThemeStyles } = usePageElements();

        const StyledPbButton = styled(PbButton)([
            getThemeStyles(theme => theme.styles?.button[type]),
            getElementStyles(element)
        ]);

        let buttonInnerContent = <pb-button-text>{buttonText}</pb-button-text>;

        let StyledPbButtonInner = PbButtonBody,
            StyledPbButtonIcon;

        if (icon && icon.svg) {
            const { position = "left", color } = icon;

            StyledPbButtonInner = styled(StyledPbButtonInner)({
                display: "flex",
                ...ICON_POSITION_FLEX_DIRECTION[position]
            });

            StyledPbButtonIcon = styled(PbButtonIcon)(
                {
                    width: icon.width,
                    ...ICON_POSITION_MARGIN[position]
                },
                getThemeStyles(theme => {
                    const themeColor = theme.styles.colors?.[color]?.base;
                    return {
                        color: themeColor || color
                    };
                })
            );

            buttonInnerContent = (
                <>
                    <StyledPbButtonIcon svg={icon.svg} />
                    {buttonInnerContent}
                </>
            );
        }

        const linkActions = ["link", "scrollToElement"];
        if (linkActions.includes(action?.actionType)) {
            const href = link?.href || action?.href;
            const newTab = link?.newTab || action?.newTab;

            return (
                <StyledPbButton element={element}>
                    <LinkComponent href={href} target={newTab ? "_blank" : "_self"}>
                        <StyledPbButtonInner>{buttonInnerContent}</StyledPbButtonInner>
                    </LinkComponent>
                </StyledPbButton>
            );
        }

        let clickHandler: ButtonClickHandler["handler"] | undefined;
        if (action?.clickHandler) {
            clickHandler = clickHandlers?.find(item => item.id === action?.clickHandler)?.handler;
        }

        return (
            <StyledPbButton element={element}>
                <StyledPbButtonInner onClick={clickHandler}>
                    {buttonInnerContent}
                </StyledPbButtonInner>
            </StyledPbButton>
        );
    };

    return Object.assign(React.memo(Button, elementDataPropsAreEqual), {
        params
    });
};
