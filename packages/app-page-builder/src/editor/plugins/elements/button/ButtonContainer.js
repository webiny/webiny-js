// @flow
import React from "react";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { set } from "dot-prop-immutable";
import { updateElement } from "@webiny/app-page-builder/editor/actions";
import { getElement } from "@webiny/app-page-builder/editor/selectors";
import ConnectedSlate from "@webiny/app-page-builder/editor/components/ConnectedSlate";

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

const ButtonContainer = props => {
    const { getAllClasses, elementStyle, elementAttributes, element } = props;
    const { type = "default", icon = {} } = element.data || {};
    const svg = icon.svg || null;
    const { alignItems } = elementStyle;

    const { position = "left" } = icon;

    const onChange = useHandler(props, ({ element, updateElement }) => (value: string) => {
        updateElement({ element: set(element, "data.text", value) });
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

export default connect(
    (state, props) => ({ element: getElement(state, props.elementId) }),
    { updateElement }
)(ButtonContainer);
