// @flow
import React from "react";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { set } from "dot-prop-immutable";
import ConnectedSlate from "@webiny/app-page-builder/editor/components/ConnectedSlate";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { updateElement } from "@webiny/app-page-builder/editor/actions";
import { getElement } from "@webiny/app-page-builder/editor/selectors";

export const className = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

const Text = props => {
    const onChange = useHandler(props, ({ element, updateElement }) => value => {
        updateElement({ element: set(element, "data.text", value) });
    });

    return (
        <ElementRoot element={props.element} className={className}>
            <ConnectedSlate elementId={props.element.id} onChange={onChange} />
        </ElementRoot>
    );
};

export default connect(
    (state, props) => ({
        element: getElement(state, props.elementId)
    }),
    { updateElement }
)(Text);
