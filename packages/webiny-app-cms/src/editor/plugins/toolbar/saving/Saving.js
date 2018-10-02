// @flow
import React from "react";
import { connect } from "react-redux";
import { getUi } from "webiny-app-cms/editor/selectors";
import { IconButton } from "webiny-ui/Button";
import { ReactComponent as SaveIcon } from "webiny-app-cms/editor/assets/icons/round-save-24px.svg";

const Saving = ({ saving }: { saving: boolean }) => {
    if (!saving) {
        return null;
    }

    return <IconButton icon={<SaveIcon />} />;
};

export default connect(state => ({ saving: getUi(state).saving || false }))(Saving);
