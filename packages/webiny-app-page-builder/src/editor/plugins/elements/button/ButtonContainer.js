// @flow
import * as React from "react";
import { connect } from "webiny-app-page-builder/editor/redux";
import { compose, withHandlers } from "recompose";
import { set } from "dot-prop-immutable";
import { updateElement } from "webiny-app-page-builder/editor/actions";
import { getElement } from "webiny-app-page-builder/editor/selectors";
import ConnectedSlate from "webiny-app-page-builder/editor/components/ConnectedSlate";

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

const ButtonContainer = ({ getAllClasses, elementStyle, elementAttributes, element, onChange }) => {
    const { type = "default", icon = {}, } = element.data || {};
    const svg = icon.svg || null;
    const { alignItems } = elementStyle;

    const { position = "left" } = icon;

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

export default compose(
    connect(
        (state, props) => ({ element: getElement(state, props.elementId) }),
        { updateElement }
    ),
    withHandlers({
        onChange: ({ element, updateElement }) => (value: string) => {
            updateElement({ element: set(element, "data.text", value) });
        }
    })
)(ButtonContainer);
