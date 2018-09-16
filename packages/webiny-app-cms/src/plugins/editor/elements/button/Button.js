import React from "react";
import { connect } from "react-redux";
import { css } from "emotion";
import { get, set } from "dot-prop-immutable";
import Slate from "webiny-app-cms/editor/components/Slate";
import ElementStyle from "webiny-app-cms/editor/components/ElementStyle";
import { updateElement } from "webiny-app-cms/editor/actions";

const combineClassNames = (...styles) => {
    return styles.filter(s => s !== "" && s !== "css-0").join(" ");
};

const Button = ({ theme, element, preview, updateElement }) => {
    const onChange = value => {
        if (!preview) {
            updateElement({ element: set(element, "data.text", value) });
        }
    };

    const { type = "default" } = get(element, "settings.advanced") || {};

    return (
        <ElementStyle element={element}>
            {({ elementStyle, inlineStyle, customClasses }) => (
                <button
                    style={{ ...get(theme, "elements.button", {}) }}
                    className={combineClassNames(
                        "webiny-cms-element-button",
                        type,
                        css(elementStyle),
                        inlineStyle,
                        ...customClasses
                    )}
                >
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
