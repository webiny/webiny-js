import React, { CSSProperties, useCallback, useRef } from "react";
import SimpleEditableText from "./SimpleEditableText";
import { PbElement } from "@webiny/app-page-builder/types";
import { useEventActionHandler } from "@webiny/app-page-builder/editor/provider";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import {
    elementByIdSelector,
    textEditorIsActiveMutation,
    textEditorIsNotActiveMutation,
    uiAtom
} from "@webiny/app-page-builder/editor/recoil/modules";
import { useRecoilState, useRecoilValue } from "recoil";

type ButtonContainerPropsType = {
    getAllClasses: (...classes: string[]) => string;
    elementStyle: CSSProperties;
    elementAttributes: { [key: string]: string };
    elementId: string;
};
const ButtonContainer: React.FunctionComponent<ButtonContainerPropsType> = ({
    getAllClasses,
    elementStyle,
    elementAttributes,
    elementId
}) => {
    const eventActionHandler = useEventActionHandler();
    const [uiAtomValue, setUiAtomValue] = useRecoilState(uiAtom);
    const { textEditorActive } = uiAtomValue;
    const element = useRecoilValue(elementByIdSelector(elementId));
    const { type = "default", icon = {}, text: dataText } = element.data || {};
    const { alignItems } = elementStyle;
    const defaultValue = typeof dataText === "string" ? dataText : "Click me";
    const value = useRef<string>(defaultValue);

    const { svg = null, position = "left" } = icon || {};

    const onChange = useCallback(
        (received: string) => {
            value.current = received;
        },
        [element.id, textEditorActive]
    );

    const onFocus = useCallback(() => {
        setUiAtomValue(textEditorIsActiveMutation);
    }, [elementId]);

    const onBlur = useCallback(() => {
        setUiAtomValue(textEditorIsNotActiveMutation);
        if (value.current === defaultValue) {
            return;
        }
        const newElement: PbElement = {
            ...element,
            elements: [],
            data: {
                ...element.data,
                text: value.current as string
            }
        };
        eventActionHandler.trigger(
            new UpdateElementActionEvent({
                element: newElement
            })
        );
    }, [elementId]);

    return (
        <div
            style={{
                display: "flex",
                justifyContent: alignItems
            }}
        >
            <a
                href={null}
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
                    value={value.current}
                    onChange={onChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                />
            </a>
        </div>
    );
};

export default ButtonContainer;
