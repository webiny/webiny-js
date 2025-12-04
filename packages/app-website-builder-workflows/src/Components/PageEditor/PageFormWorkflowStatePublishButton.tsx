import React from "react";
import { PageEditorConfig } from "@webiny/app-website-builder";

const { Ui } = PageEditorConfig;

export const PageFormWorkflowStatePublishButton = () => {
    return <Ui.TopBar.Action remove={true} name={"buttonPublish"} />;
};
