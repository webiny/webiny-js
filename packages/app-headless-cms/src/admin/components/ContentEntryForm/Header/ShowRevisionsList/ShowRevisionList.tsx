import React from "react";
import { useFeature } from "@webiny/app";
import { ReactComponent as ListIcon } from "@webiny/icons/checklist.svg";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import { useContentEntryFormPresenter } from "~/presentation/contentEntries/views/ContentEntryFormPresenterProvider.js";
import { RevisionsListFeature } from "~/presentation/contentEntries/revisionsList/feature.js";

export const ShowRevisionList = () => {
    const { useOptionsMenuItem } = ContentEntryEditorConfig.Actions.MenuItemAction;
    const { OptionsMenuItem } = useOptionsMenuItem();
    const { vm } = useContentEntryFormPresenter();
    const { presenter: revisionsPresenter } = useFeature(RevisionsListFeature);

    return (
        <OptionsMenuItem
            icon={<ListIcon />}
            label={"Show entry revisions"}
            disabled={!vm.entry}
            onAction={() => revisionsPresenter.show()}
            data-testid={"cms.content-form.header.show-revisions"}
        />
    );
};
