import React from "react";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";
import { WorkflowStateTooltip } from "@webiny/app-workflows";
import type { IWorkflowStatePresenter } from "@webiny/app-workflows/Presenters/index.js";

const { Actions } = ContentEntryEditorConfig;

export interface ICmsEntryFormTooltipButtonProps {
    presenter: IWorkflowStatePresenter;
}

export const CmsEntryFormTooltipButton = (props: ICmsEntryFormTooltipButtonProps) => {
    const { presenter } = props;
    return (
        <ContentEntryEditorConfig>
            <Actions.ButtonAction
                before={"save"}
                name={"workflowStateTooltip"}
                element={<WorkflowStateTooltip presenter={presenter} />}
            />
        </ContentEntryEditorConfig>
    );
};
