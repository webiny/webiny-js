import React, { CSSProperties } from "react";
import { useRecoilValue } from "recoil";
import kebabCase from "lodash/kebabCase";
import { PbEditorElement } from "~/types";
import { elementByIdSelector, uiAtom } from "~/editor/recoil/modules";
import { useElementVariableValue } from "~/editor/hooks/useElementVariableValue";
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
    const uiAtomValue = useRecoilValue(uiAtom);
    const element = useRecoilValue(elementByIdSelector(elementId)) as PbEditorElement;
    const { type = "default", icon = {}, buttonText } = element.data || {};
    const variableValue = useElementVariableValue(element);
    const value =
        variableValue?.label || (typeof buttonText === "string" ? buttonText : "Click me");

    const { svg = null, position = "left" } = icon || {};
    // Use per-device style
    const justifyContent =
        elementStyle[
            `--${kebabCase(
                uiAtomValue.displayMode
            )}-justify-content` as unknown as keyof CSSProperties
        ];

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
                {value}
            </a>
        </div>
    );
};

export default ButtonContainer;
