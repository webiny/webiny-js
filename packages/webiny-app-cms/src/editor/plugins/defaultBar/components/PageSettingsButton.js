// @flow
import React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { togglePlugin } from "webiny-app-cms/editor/actions";
import { IconButton } from "webiny-ui/Button";
import { ReactComponent as SettingsIcon } from "./icons/settings.svg";

const PageSettingsButton = ({ togglePlugin }) => {
    return (
        <IconButton
            onClick={() => togglePlugin({ name: "pb-editor-page-settings-bar" })}
            icon={<SettingsIcon />}
        />
    );
};

export default connect(
    null,
    { togglePlugin }
)(PageSettingsButton);
