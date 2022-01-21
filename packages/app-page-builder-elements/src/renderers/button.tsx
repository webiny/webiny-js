import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer } from "~/types";

declare global {
    namespace JSX {
        interface IntrinsicElements {
            "pb-button": any;
            "pb-button-icon": any;
            "pb-button-text": any;
        }
    }
}

export interface Params {
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

export const createButton = (args: Params = {}): ElementRenderer => {
    const LinkComponent = args?.LinkComponent || DefaultLinkComponent;

    return ({ element }) => {
        const { buttonText, link, type, icon } = element.data;

        const { getElementClassNames, getThemeClassNames, combineClassNames } = usePageElements();

        const themeClassNames = getThemeClassNames(theme => theme.styles.buttons[type]);
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
};
