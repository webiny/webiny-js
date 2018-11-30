// @flow
import * as React from "react";
import { connect } from "react-redux";
import { compose, withHandlers } from "recompose";
import { get, set } from "dot-prop-immutable";
import { updateElement } from "webiny-app-cms/editor/actions";
import { getElement } from "webiny-app-cms/editor/selectors";
import ConnectedSlate from "webiny-app-cms/editor/components/ConnectedSlate";

const excludePlugins = [
    "align",
    "align-menu-item",
    "ordered-list-menu-item",
    "unordered-list-menu-item",
    "lists",
    "code-menu-item"
];

const ButtonContainer = ({ getAllClasses, element, onChange }) => {
    const { type = "default", icon = {} } = get(element, "settings.advanced") || {};
    const svg = element.data.icon || null;

    // TODO: @sven render according to icon position
    const { position = "left" } = icon;

    return (
        <button className={getAllClasses("webiny-cms-element-button", type)}>
            {svg && <span dangerouslySetInnerHTML={{ __html: svg }} />}
            <ConnectedSlate elementId={element.id} onChange={onChange} exclude={excludePlugins} />
        </button>
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
