import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer } from "~/types";
import styled from "@emotion/styled";

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
    LinkComponent?: React.ComponentType<{ href: string; newTab: boolean }>;
}

interface DefaultLinkComponentProps {
    href: string;
    newTab?: boolean;
}

const DefaultLinkComponent: React.FC<DefaultLinkComponentProps> = ({ href, newTab, children }) => {
    return (
        <a href={href} target={newTab ? "_blank" : "_self"} rel={"noreferrer"}>
            {children}
        </a>
    );
};

export const createButton = (params: CreateButtonParams = {}): ElementRenderer => {
    const LinkComponent = params?.LinkComponent || DefaultLinkComponent;

    return ({ element }) => {
        const { buttonText, link, type, icon } = element.data;

        const { getElementStyles, getThemeStyles } = usePageElements();

        const themeStyles = getThemeStyles(theme => {
            if (!theme.styles || !theme.styles.buttons) {
                return {};
            }

            return theme.styles.buttons[type];
        });

        const elementStyles = getElementStyles(element);

        const styles = [...themeStyles, ...elementStyles];
        const PbButton = styled(({ className, children }) => (
            <pb-button class={className}>{children}</pb-button>
        ))(styles);

        return (
            <PbButton>
                <LinkComponent {...link}>
                    <pb-button-body style={{ color: "white", backgroundColor: "#fa5723" }}>
                        {icon && <pb-button-icon dangerouslySetInnerHTML={{ __html: icon.svg }} />}
                        <pb-button-text>{buttonText}</pb-button-text>
                    </pb-button-body>
                </LinkComponent>
            </PbButton>
        );
    };
};
