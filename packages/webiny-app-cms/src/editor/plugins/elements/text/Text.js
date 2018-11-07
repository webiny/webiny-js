import React from "react";
import { connect } from "react-redux";
import { compose, withHandlers, pure } from "recompose";
import { set } from "dot-prop-immutable";
import Slate from "webiny-app-cms/editor/components/Slate";
import ElementStyle from "webiny-app-cms/render/components/ElementStyle";
import { updateElement } from "webiny-app-cms/editor/actions";

export const className = "webiny-cms-element-text";

const Text = pure(({ element, onChange }) => {
    return (
        <ElementStyle element={element} className={className}>
            <Slate value={element.data.text} onChange={onChange} />
        </ElementStyle>
    );
});

export default compose(
    connect(
        null,
        { updateElement }
    ),
    withHandlers({
        onChange: ({ element, updateElement }) => value => {
            updateElement({ element: set(element, "data.text", value) });
        }
    })
)(Text);
