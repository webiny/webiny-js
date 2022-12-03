import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer, Element, LinkComponent } from "~/types";
import styled from "@emotion/styled";
import { DefaultLinkComponent } from "~/renderers/components";

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

export interface CreateButtonParams {
    linkComponent?: LinkComponent;
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

const PbButtonIcon: React.FC<{ className?: string; icon: any }> = ({ className, icon }) => (
    <pb-button-icon class={className} dangerouslySetInnerHTML={{ __html: icon.svg }} />
);

export const createButton = (params: CreateButtonParams = {}): ElementRenderer => {
    const LinkComponent = params?.linkComponent || DefaultLinkComponent;

    return function Button({ element }) {
        const { buttonText, link, type, icon } = element.data;

        const { getElementStyles, getThemeStyles } = usePageElements();

        const themeStyles = getThemeStyles(theme => {
            if (!theme.styles.button) {
                return {};
            }

            return theme.styles.button[type];
        });

        const elementStyles = getElementStyles(element);

        const styles = [themeStyles, elementStyles];

        const StyledPbButton = styled(PbButton)(styles);

        let iconLeft = null,
            iconRight = null;
        if (icon) {
            const { position } = icon;
            const StyledPbButtonIcon = styled(PbButtonIcon)({
                width: icon.width,
                marginLeft: position === "right" ? 5 : undefined,
                marginRight: position !== "right" ? 5 : undefined
            });

            if (icon.position === "right") {
                iconRight = <StyledPbButtonIcon icon={icon} />;
            } else {
                iconLeft = <StyledPbButtonIcon icon={icon} />;
            }
        }

        return (
            <StyledPbButton element={element}>
                <LinkComponent
                    href={link?.href}
                    target={link?.newTab ? "_blank" : "_self"}
                    // TODO: onClick={}
                >
                    {iconLeft}
                    <pb-button-text>{buttonText}</pb-button-text>
                    {iconRight}
                </LinkComponent>
            </StyledPbButton>
        );
    };
};
