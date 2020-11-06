import React, { CSSProperties, useCallback, useEffect, useRef } from "react";
import { PbElement } from "@webiny/app-page-builder/types";
// import Slate from "@webiny/app-page-builder/editor/components/Slate";
import { useEventActionHandler } from "@webiny/app-page-builder/editor/provider";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { elementByIdSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { useRecoilValue } from "recoil";

// const excludePlugins = [
//     "pb-editor-slate-menu-item-link",
//     "pb-editor-slate-menu-item-align",
//     "pb-editor-slate-menu-item-ordered-list",
//     "pb-editor-slate-menu-item-unordered-list",
//     "pb-editor-slate-menu-item-code",
//     "pb-editor-slate-editor-align",
//     "pb-editor-slate-editor-lists",
//     "pb-editor-slate-editor-link"
// ];
type ButtonContainerPropsType = {
    getAllClasses: (...classes: string[]) => string;
    elementStyle: CSSProperties;
    elementAttributes: { [key: string]: string };
    elementId: string;
};
const ButtonContainer: React.FunctionComponent<ButtonContainerPropsType> = props => {
    const eventActionHandler = useEventActionHandler();
    const { getAllClasses, elementStyle, elementAttributes, elementId } = props;
    const element = useRecoilValue(elementByIdSelector(elementId));
    const { type = "default", icon = {} } = element.data || {};
    const { alignItems } = elementStyle;
    const defaultValue = typeof element.data.text === "string" ? element.data.text : "Click me";
    const value = useRef<string>(defaultValue);
    const buttonTextRef = useRef<HTMLElement>();

    const { svg = null, position = "left" } = icon || {};

    const onChange = useCallback(
        (ev: InputEvent) => {
            console.log(ev);
            const target = ev.target as HTMLElement;
            const elementValue = target.innerHTML || "";
            ev.stopPropagation();
            if (elementValue === value.current) {
                return false;
            }
            console.log(value);
            console.log(value.current, elementValue);
            value.current = elementValue;
            ev.preventDefault();
            ev.stopImmediatePropagation();
            ev.cancelBubble = true;
            return true;
        },
        [elementId]
    );
    const onBlur = useCallback(() => {
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

    useEffect(() => {
        if (!buttonTextRef.current) {
            return;
        }
        buttonTextRef.current.addEventListener("input", onChange);
        buttonTextRef.current.addEventListener("blur", onBlur);
        return () => {
            buttonTextRef.current.removeEventListener("input", onChange);
            buttonTextRef.current.removeEventListener("blur", onBlur);
        };
    }, [buttonTextRef.current]);

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
                {React.createElement("div", {
                    ref: buttonTextRef,
                    contentEditable: true,
                    dangerouslySetInnerHTML: {
                        __html: value.current
                    }
                })}
                {/*<span contentEditable={true} onChange={onChange}>initial value</span>*/}
                {/*<Slate value={defaultValue} onChange={onChange} exclude={excludePlugins} />*/}
            </a>
        </div>
    );
};

export default ButtonContainer;
