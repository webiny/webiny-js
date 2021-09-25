import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer } from "~/types";

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

const Button: ElementRenderer = ({ element }) => {
    const { buttonText, link, type, icon } = element.data;

    const { getCss, getThemeCss, css } = usePageElements();

    const themeClassNames = getThemeCss(theme => theme.styles.buttons[type]);
    const elementClassNames = getCss(element);

    const classNames = css.cx(themeClassNames, elementClassNames);

    return (
        <pb-button class={classNames}>
            <a href={link.href} target={link.newTab ? "_blank" : "_self"} rel={"noreferrer"}>
                {icon && <pb-button-icon dangerouslySetInnerHTML={{ __html: icon.svg }} />}
                <pb-button-text>{buttonText}</pb-button-text>
            </a>
        </pb-button>
    );
};

export const createButton = () => Button;
