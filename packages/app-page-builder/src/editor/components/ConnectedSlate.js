// @flow
import * as React from "react";
import { get } from "lodash";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { isEqual } from "lodash";
import { getElement } from "@webiny/app-page-builder/editor/selectors";
import Slate from "./Slate";

const ConnectedSlate = React.memo((props: Object) => {
    return <Slate {...props} />;
});

export default connect(
    (state, props) => ({
        value: get(getElement(state, props.elementId), "data.text")
    }),
    null,
    null,
    { areStatePropsEqual: isEqual }
)(ConnectedSlate);
