import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer } from "~/types";

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-button": any;
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

    // TODO @ts-refactor fix "Component definition is missing display name"
    // eslint-disable-next-line
    const AA = ({ element }) => {
        const { buttonText, link, type, icon } = element.data;

        const { getElementClassNames, getThemeClassNames, combineClassNames } = usePageElements();

        const themeClassNames = getThemeClassNames(theme => {
            if (!theme.styles || !theme.styles.buttons) {
                return {};
            }

            const value = theme.styles.buttons[type];

            return value;
        });
        const elementClassNames = getElementClassNames(element);

        const classNames = combineClassNames(themeClassNames, elementClassNames);

        return (
            <pb-button class={classNames}>
                <LinkComponent {...link}>
                    {icon && <pb-button-icon dangerouslySetInnerHTML={{ __html: icon.svg }} />}
                    <pb-button-text>{buttonText}</pb-button-text>
                </LinkComponent>
            </pb-button>
        );
    };

    return <AA/>
};
