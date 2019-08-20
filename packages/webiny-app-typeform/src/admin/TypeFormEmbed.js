// @flow
import React from "react";
import { connect } from "webiny-app-page-builder/editor/redux";
import { compose } from "recompose";
import { getElement } from "webiny-app-page-builder/editor/selectors";

const TypeFormEmbed = (props: { element: Object }) => {
    const { source } = props.element.data;
    if (!source || !source.url) {
        return <span>You must configure your embed in the settings!</span>;
    }

    return <iframe frameBorder="0" src={source.url} style={{ height: "100%", width: "100%" }} />;
};

export default compose(
    connect((state, props) => ({
        element: getElement(state, props.elementId)
    }))
)(TypeFormEmbed);
