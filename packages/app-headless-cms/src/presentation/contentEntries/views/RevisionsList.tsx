import React from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { List, OverlayLoader } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";
import { RevisionsListFeature } from "../revisionsList/feature.js";
import { RevisionListItem } from "./RevisionListItem.js";

const t = i18n.ns("app-headless-cms/admin/plugins/content-details/content-revisions");

export const RevisionsList = observer(() => {
    const { presenter: revisionsPresenter } = useFeature(RevisionsListFeature);
    const { vm } = revisionsPresenter;

    return (
        <div className={"relative"}>
            {vm.loading && <OverlayLoader />}
            {vm.revisions.length ? (
                <List data-testid={"cms.content-form.revisions"}>
                    {vm.revisions.map(revision => (
                        <RevisionListItem revision={revision} key={revision.id} />
                    ))}
                </List>
            ) : (
                <div className={"p-lg"}>{t`No revisions to show.`}</div>
            )}
        </div>
    );
});
