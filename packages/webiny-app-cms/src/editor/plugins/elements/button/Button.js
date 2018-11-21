import React from "react";
import { connect } from "react-redux";
import { get, set } from "dot-prop-immutable";
import Slate from "webiny-app-cms/editor/components/Slate";
import ElementStyle from "webiny-app-cms/render/components/ElementStyle";
import { updateElement } from "webiny-app-cms/editor/actions";

const Button = ({ theme, element, preview, updateElement }) => {
    const onChange = value => {
        if (!preview) {
            updateElement({ element: set(element, "data.text", value) });
        }
    };

    const { type = "default", icon = {} } = get(element, "settings.advanced") || {};
    const svg = element.data.icon || null;
    // TODO: @sven render according to icon position
    const { position = "left" } = icon;

    return (
        <ElementStyle element={element}>
            {({ getAllClasses }) => (
                <button className={getAllClasses("webiny-cms-element-button", type)}>
                    {svg && <span dangerouslySetInnerHTML={{ __html: svg }} />}
                    <Slate
                        value={element.data.text}
                        onChange={onChange}
                        exclude={[
                            "align",
                            "align-menu-item",
                            "ordered-list-menu-item",
                            "unordered-list-menu-item",
                            "lists",
                            "code-menu-item"
                        ]}
                    />
                </button>
            )}
        </ElementStyle>
    );
};

export default connect(
    null,
    { updateElement }
)(Button);
