import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as HistoryIcon } from "@webiny/icons/history.svg";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { ActivityLogAdminFeature } from "~/admin/feature.js";

/**
 * The toggle that opens the activity panel.
 *
 * In the entry header rather than inside the form, because the panel is a way of *looking at* the
 * entry rather than a part of it — the same reason revisions and publishing live there.
 *
 * Beside comments, and styled like it. The two answer neighbouring questions about one entry —
 * what was said about it, and what happened to it — so a reader should find them together rather
 * than at opposite ends of a toolbar with the save actions in between. Ghost until it is open and
 * `secondary` while it is, which is what the comments toggle does; a `primary` button here
 * competed with Save & Publish for the loudest thing on the screen.
 *
 * Absent on an unsaved entry: there is nothing to have a history of yet, and a control that opens
 * an empty panel is worse than no control.
 */
export const ActivityToggleButton = createReactiveComponent(() => {
    const presenter = useContentEntryFormPresenter();
    const { panel } = useFeature(ActivityLogAdminFeature);
    const { entry, isNewEntry } = presenter.vm;

    if (isNewEntry || !entry?.entryId) {
        return null;
    }

    return (
        <Button
            variant={panel.vm.open ? "secondary" : "ghost"}
            icon={<HistoryIcon />}
            onClick={() => panel.toggle()}
            text={"Activity"}
            data-testid={"cms.content-form.header.activity"}
        />
    );
});
