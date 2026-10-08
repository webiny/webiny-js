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

    return (
        <div className={"px-lg pt-md"}>
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
        </div>
    );
});
