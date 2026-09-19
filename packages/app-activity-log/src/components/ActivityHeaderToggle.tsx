import React from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { Button } from "@webiny/admin-ui";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";
import { ReactComponent as HistoryIcon } from "@webiny/icons/history.svg";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { ActivityLogAdminFeature } from "~/feature.js";

const { Actions } = ContentEntryEditorConfig;

/**
 * The toggle that opens the activity panel.
 *
 * In the entry header rather than inside the form, because the panel is a way of *looking at* the
 * entry rather than a part of it — the same reason revisions and publishing live there. Placed
 * before the save buttons so it sits with the other view controls instead of among the actions
 * that change the entry.
 *
 * Absent on an unsaved entry: there is nothing to have a history of yet, and a control that opens
 * an empty panel is worse than no control.
 */
const ActivityToggleButton = observer(() => {
    const presenter = useContentEntryFormPresenter();
    const { panel } = useFeature(ActivityLogAdminFeature);
    const { entry, isNewEntry } = presenter.vm;

    if (isNewEntry || !entry?.entryId) {
        return null;
    }

    return (
        <Button
            variant={panel.vm.open ? "primary" : "secondary"}
            size={"sm"}
            icon={<HistoryIcon />}
            onClick={() => panel.toggle()}
            text={"Activity"}
        />
    );
});

export const ActivityHeaderToggle = () => (
    <ContentEntryEditorConfig>
        <Actions.ButtonAction
            before={"save"}
            name={"activityLog"}
            element={<ActivityToggleButton />}
        />
    </ContentEntryEditorConfig>
);
