// @flow
import React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { getUi } from "webiny-app-cms/editor/selectors";
import { IconButton } from "webiny-ui/Button";
import { Tooltip } from "webiny-ui/Tooltip";

import { ReactComponent as SaveIcon } from "webiny-app-cms/editor/assets/icons/baseline-cloud_upload-24px.svg";
import { ReactComponent as SavedIcon } from "webiny-app-cms/editor/assets/icons/baseline-cloud_done-24px.svg";

const Saving = ({ saving }: { saving: boolean }) => {
    if (!saving) {
        return (
            <Tooltip placement={"right"} content={<span>{"All changes saved"}</span>}>
                <IconButton icon={<SavedIcon />} />
            </Tooltip>
        );
    }

    return (
        <Tooltip placement={"right"} content={<span>{"Saving changes ..."}</span>}>
            <IconButton icon={<SaveIcon />} />
        </Tooltip>
    );
};

export default connect(state => ({ saving: getUi(state).saving || false }))(Saving);
