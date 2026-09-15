import React from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { OptionsMenuItem } from "@webiny/app-admin/components/OptionsMenu/index.js";
import { ReactComponent as CompareIcon } from "@webiny/icons/compare_arrows.svg";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/exports/admin/cms/entry/editor.js";
import { CmsCompareEntryRevisionsPresentationFeature } from "./feature.js";

export const CmsCompareEntryRevisionsMenuItem = createReactiveComponent(() => {
    const formPresenter = useContentEntryFormPresenter();
    const { presenter } = useFeature(CmsCompareEntryRevisionsPresentationFeature);

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
