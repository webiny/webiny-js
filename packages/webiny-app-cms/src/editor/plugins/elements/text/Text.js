// @flow
import React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { compose, withHandlers } from "recompose";
import { set } from "dot-prop-immutable";
import ConnectedSlate from "webiny-app-cms/editor/components/ConnectedSlate";
import { ElementRoot } from "webiny-app-cms/render/components/ElementRoot";
import { updateElement } from "webiny-app-cms/editor/actions";
import { getElement } from "webiny-app-cms/editor/selectors";

export const className = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

const Text = ({ element, onChange }) => {
    return (
        <ElementRoot element={element} className={className}>
            <ConnectedSlate elementId={element.id} onChange={onChange} />
        </ElementRoot>
    );
};

export default compose(
    connect(
        (state, props) => ({
            element: getElement(state, props.elementId)
        }),
        { updateElement }
    ),
    withHandlers({
        onChange: ({ element, updateElement }) => value => {
            updateElement({ element: set(element, "data.text", value) });
        }
    })
)(Text);
