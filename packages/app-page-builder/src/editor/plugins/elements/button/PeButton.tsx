import React, { useCallback, useRef } from "react";
import { css, cx } from "emotion";
import merge from "lodash/merge";
import set from "lodash/set";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import { PbEditorElement } from "~/types";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { UpdateElementActionEvent } from "~/editor/recoil/actions";
import SimpleEditableText from "./SimpleEditableText";

const buttonEditStyle = css({
    "&.button__content--empty": {
        minWidth: 64,
        lineHeight: "20px",
        marginTop: "-3px",
        marginBottom: "-3px"
    }
});

const DATA_NAMESPACE = "data.buttonText";

const getButtonIconStyles = (position: "left" | "right" | "top" | "bottom") => {
    switch (position) {
        case "left":
            return {
                flexDirection: "row",
                svg: {
                    marginRight: 8
                }
            };
        case "right":
            return {
                flexDirection: "row-reverse",
                svg: {
                    marginLeft: 8
                }
            };
        case "top":
            return {
                flexDirection: "column",
                svg: {
                    marginBottom: 8
                }
            };
        case "bottom":
            return {
                flexDirection: "column-reverse",
                svg: {
                    marginTop: 8
                }
            };
    }
};

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

const Button = ({ element }) => {
    const eventActionHandler = useEventActionHandler();
    const isActive = true;
    const { type = "default", icon = {}, buttonText } = element.data || {};
    const defaultValue = typeof buttonText === "string" ? buttonText : "Click me";
    const value = useRef<string>(defaultValue);

    const { svg = null, position = "left" } = icon || {};

    const onChange = useCallback(
        (received: string) => {
            value.current = received;
        },
        [element.id]
    );

    const onBlur = useCallback(() => {
        if (value.current === defaultValue) {
            return;
        }

        const newElement: PbEditorElement = merge(
            {},
            element,
            set({ elements: [] }, DATA_NAMESPACE, value.current)
        );

        eventActionHandler.trigger(
            new UpdateElementActionEvent({
                element: newElement,
                history: true
            })
        );
    }, [element.id, element.data]);

    const { getClassNames, getElementClassNames, getThemeClassNames, combineClassNames } =
        usePageElements();

    const defaultThemeClassNames = getThemeClassNames(theme => theme.styles.buttons["default"]);
    const themeClassNames = getThemeClassNames(theme => theme.styles.buttons[type]);
    const elementClassNames = getElementClassNames(element);

    const classNames = combineClassNames(
        getClassNames({
            boxSizing: "border-box",
            "& a": {
                color: "inherit",
                display: "flex",
                ...getButtonIconStyles(position)
            }
        }),
        defaultThemeClassNames,
        themeClassNames,
        elementClassNames
    );

    return (
        <pb-button class={classNames}>
            <a href={null}>
                {svg && <pb-button-icon dangerouslySetInnerHTML={{ __html: svg }} />}
                {isActive ? (
                    <SimpleEditableText
                        className={cx(buttonEditStyle, {
                            "button__content--empty": !value.current
                        })}
                        value={value.current}
                        onChange={onChange}
                        onBlur={onBlur}
                    />
                ) : (
                    <pb-button-text>{buttonText}</pb-button-text>
                )}
            </a>
        </pb-button>
    );
};

export default Button;
