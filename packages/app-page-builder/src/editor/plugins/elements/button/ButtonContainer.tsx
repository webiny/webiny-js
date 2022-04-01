import React, { CSSProperties, useCallback, useRef } from "react";
import { useRecoilValue } from "recoil";
import { css } from "emotion";
import classNames from "classnames";
import kebabCase from "lodash/kebabCase";
import merge from "lodash/merge";
import set from "lodash/set";
import { PbEditorElement } from "~/types";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { UpdateElementActionEvent } from "~/editor/recoil/actions";
import { elementByIdSelector, uiAtom } from "~/editor/recoil/modules";
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
interface ButtonContainerPropsType {
    getAllClasses: (...classes: string[]) => string;
    elementStyle: CSSProperties;
    elementAttributes: { [key: string]: string };
    elementId: string;
}
const ButtonContainer: React.FC<ButtonContainerPropsType> = ({
    getAllClasses,
    elementStyle,
    elementAttributes,
    elementId
}) => {
    const eventActionHandler = useEventActionHandler();
    const uiAtomValue = useRecoilValue(uiAtom);
    const element = useRecoilValue(elementByIdSelector(elementId)) as PbEditorElement;
    const { type = "default", icon = {}, buttonText } = element.data || {};
    const defaultValue = typeof buttonText === "string" ? buttonText : "Click me";
    const value = useRef<string>(defaultValue);

    const { svg = null, position = "left" } = icon || {};
    // Use per-device style
    const justifyContent =
        elementStyle[
            `--${kebabCase(
                uiAtomValue.displayMode
            )}-justify-content` as unknown as keyof CSSProperties
        ];

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
                history: true,
                debounce: false
            })
        );
    }, [elementId, element.data]);

    const style: CSSProperties = {
        display: "flex",
        /**
         * Figure out better types
         */
        // TODO @ts-refactor
        justifyContent: justifyContent as any
    };
    return (
        <div style={style}>
            <a
                style={elementStyle}
                {...elementAttributes}
                className={getAllClasses(
                    "webiny-pb-page-element-button",
                    "webiny-pb-page-element-button--" + type,
                    "webiny-pb-page-element-button__icon--" + position
                )}
            >
                {svg && <span dangerouslySetInnerHTML={{ __html: svg }} />}
                <SimpleEditableText
                    className={classNames(buttonEditStyle, {
                        "button__content--empty": !value.current
                    })}
                    value={value.current}
                    onChange={onChange}
                    onBlur={onBlur}
                />
            </a>
        </div>
    );
};

export default ButtonContainer;
