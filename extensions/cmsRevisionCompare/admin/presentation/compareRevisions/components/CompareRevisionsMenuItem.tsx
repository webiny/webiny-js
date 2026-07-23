import React from "react";
import { useFeature, createReactiveComponent } from "webiny/admin";
import { OptionsMenuItem } from "webiny/admin/ui";
import { ReactComponent as CompareIcon } from "webiny/admin/icons/compare_arrows.svg";
import { useContentEntryFormPresenter } from "webiny/admin/cms/entry/editor";
import { CompareRevisionsPresentationFeature } from "../feature.js";

export const CompareRevisionsMenuItem = createReactiveComponent(() => {
    const formPresenter = useContentEntryFormPresenter();
    const { presenter } = useFeature(CompareRevisionsPresentationFeature);

    return (
        <OptionsMenuItem
            icon={<CompareIcon />}
            label={"Compare revisions"}
            disabled={!formPresenter.vm.entry}
            onAction={() => presenter.showDrawer()}
            data-testid={"cms.content-form.header.compare-revisions"}
        />
    );
});
