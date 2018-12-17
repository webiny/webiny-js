// @flow
import * as React from "react";
import { pure } from "recompose";
import { get } from "lodash";
import { connect } from "webiny-app-cms/editor/redux";
import { isEqual } from "lodash";
import { getElement } from "webiny-app-cms/editor/selectors";
import Slate from "./Slate";

const ConnectedSlate = pure((props: Object) => {
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
