import React, { CSSProperties } from "react";
import ConnectedSlate from "@webiny/app-page-builder/editor/components/ConnectedSlate";
import { elementByIdSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { updateElementAction } from "@webiny/app-page-builder/editor/recoil/actions/updateElement";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { useRecoilValue } from "recoil";

const excludePlugins = [
    "pb-editor-slate-menu-item-link",
    "pb-editor-slate-menu-item-align",
    "pb-editor-slate-menu-item-ordered-list",
    "pb-editor-slate-menu-item-unordered-list",
    "pb-editor-slate-menu-item-code",
    "pb-editor-slate-editor-align",
    "pb-editor-slate-editor-lists",
    "pb-editor-slate-editor-link"
];
type ButtonContainerPropsType = {
    getAllClasses: (...classes: string[]) => string;
    elementStyle: CSSProperties;
    elementAttributes: { [key: string]: string };
    elementId: string;
};
const ButtonContainer: React.FunctionComponent<ButtonContainerPropsType> = props => {
    const { getAllClasses, elementStyle, elementAttributes, elementId } = props;
    const element = useRecoilValue(elementByIdSelector(elementId));
    const { type = "default", icon = {} } = element.data || {};
    const svg = icon.svg || null;
    const { alignItems } = elementStyle;

    const { position = "left" } = icon;

    const onChange = useHandler(props, ({ element }) => (value: string) => {
        const newElement = {
            ...element,
            data: {
                ...(element.data || {}),
                text: value
            }
        };
        updateElementAction({
            element: newElement
        });
    });

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
                <ConnectedSlate
                    elementId={element.id}
                    onChange={onChange}
                    exclude={excludePlugins}
                />
            </a>
        </div>
    );
};

export default ButtonContainer;
