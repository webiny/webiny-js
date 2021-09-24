import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementComponent } from "~/types";

declare global {
    //eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-button": any;
            "pb-button-icon": any;
            "pb-button-text": any;
        }
    }
}

const Button: ElementComponent = ({ element }) => {
    const { getStyles, getThemeStyles } = usePageElements();

    const { buttonText, link, type, icon } = element.data;

    return (
        <pb-button class={getStyles({ element, styles: getThemeStyles() })}>
            <a href={link.href} target={link.newTab ? "_blank" : "_self"} rel={"noreferrer"}>
                {icon && <pb-button-icon dangerouslySetInnerHTML={{ __html: icon.svg }} />}
                <pb-button-text>{buttonText}</pb-button-text>
            </a>
        </pb-button>
    );
};

export const createButton = () => Button;
