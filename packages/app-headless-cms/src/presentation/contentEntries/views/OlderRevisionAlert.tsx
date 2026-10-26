import React from "react";
import { observer } from "mobx-react-lite";
import { useFeature, useRouter } from "@webiny/app";
import { useRoute } from "@webiny/app-admin";
import { Alert } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";
import { useContentEntryFormPresenter } from "~/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { RevisionsListFeature } from "../revisionsList/feature.js";
import { Routes } from "~/routes.js";

const t = i18n.ns("app-headless-cms/admin/plugins/content-details/content-revisions");

export const OlderRevisionAlert = observer(() => {
    const formPresenter = useContentEntryFormPresenter();
    const { presenter: revisionsPresenter } = useFeature(RevisionsListFeature);
    const router = useRouter();
    const { route } = useRoute(Routes.ContentEntries.List);

    const revisions = revisionsPresenter.vm.revisions;
    const currentVersion = formPresenter.vm.entry?.meta?.version;
    const latestRevision = revisions[0];

    if (!currentVersion || !latestRevision || currentVersion >= latestRevision.meta.version) {
        return null;
    }

    const goToLatest = (e: React.MouseEvent) => {
        e.preventDefault();
        router.goToRoute(Routes.ContentEntries.List, {
            ...route.params,
            id: latestRevision.id
        });
    };

    /*
      No wrapper and no padding of its own: this renders into the form layout's `notice` slot,
      which already positions it at the form's width and spaces it from the form below. The slot
      detects an absent notice by being empty, so anything returned here — including a wrapper
      around nothing — would hold the gap open on every entry that is on its latest revision.
    */
    return (
        <Alert type={"warning"} variant={"subtle"}>
            {t`You're looking at revision #{currentVersion}. The latest is #{latestVersion} ({link}).`(
                {
                    currentVersion,
                    latestVersion: latestRevision.meta.version,
                    link: (
                        <a href={"#"} onClick={goToLatest}>
                            {t`go to latest`}
                        </a>
                    )
                }
            )}
        </Alert>
    );
});
