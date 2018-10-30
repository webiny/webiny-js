import React from "react";
import { connect } from "react-redux";
import { pure } from "recompose";
import { set } from "dot-prop-immutable";
import Slate from "webiny-app-cms/editor/components/Slate";
import ElementStyle from "webiny-app-cms/render/components/ElementStyle";
import { updateElement } from "webiny-app-cms/editor/actions";

const Text = pure(({ element, preview, updateElement }) => {
    const onChange = value => {
        if (!preview) {
            updateElement({ element: set(element, "data.text", value) });
        }
    };

    return (
        <ElementStyle element={element} className={className}>
            <Slate value={element.data.text} onChange={onChange} />
        </ElementStyle>
    );
});

export const className = "webiny-cms-element-text";

export default connect(
    null,
    { updateElement }
)(Text);
