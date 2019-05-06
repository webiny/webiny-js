// @flow
import * as React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { compose, withHandlers } from "recompose";
import { set } from "dot-prop-immutable";
import { updateElement } from "webiny-app-cms/editor/actions";
import { getElement } from "webiny-app-cms/editor/selectors";
import ConnectedSlate from "webiny-app-cms/editor/components/ConnectedSlate";

const excludePlugins = [
    "cms-slate-menu-item-link",
    "cms-slate-menu-item-align",
    "cms-slate-menu-item-ordered-list",
    "cms-slate-menu-item-unordered-list",
    "cms-slate-menu-item-code",
    "cms-slate-editor-align",
    "cms-slate-editor-lists",
    "cms-slate-editor-link"
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
                    "webiny-cms-element-button",
                    "webiny-cms-element-button--" + type,
                    "webiny-cms-element-button__icon--" + position
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
