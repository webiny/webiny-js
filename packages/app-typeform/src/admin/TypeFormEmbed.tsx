import React from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { getElement } from "@webiny/app-page-builder/editor/selectors";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-typeform/admin");

const TypeFormEmbed = (props: { element }) => {
    const { source } = props.element.data;
    if (!source || !source.url) {
        return <span>{t`You must configure your embed in the settings!`}</span>;
    }

    return <iframe frameBorder="0" src={source.url} style={{ height: "100%", width: "100%" }} />;
};

export default connect((state, props: any) => ({
    element: getElement(state, props.elementId)
}))(TypeFormEmbed);
