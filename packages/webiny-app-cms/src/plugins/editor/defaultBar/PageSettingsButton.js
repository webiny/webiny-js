import React from "react";
import { connect } from "react-redux";
import { togglePlugin } from "webiny-app-cms/editor/actions";
import { IconButton } from "webiny-ui/Button";
import { ReactComponent as SettingsIcon } from "webiny-app-cms/editor/assets/icons/settings.svg";

const PageSettingsButton = ({ togglePlugin }) => {
    return (
        <IconButton
            onClick={() => togglePlugin({ name: "cms-page-settings-bar" })}
            icon={<SettingsIcon />}
        />
    );
};

export default connect(
    null,
    { togglePlugin }
)(PageSettingsButton);
