import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { useWorkflowsPermission } from "~/presentation/permissions/useWorkflowsPermission.js";
import { resolveViewerTimeZone } from "~/settings/model/time/resolveViewerTimeZone.js";
import { ExclusionDialogHost } from "~/settings/presentation/exclusionDialog/components/ExclusionDialogHost.js";
import { RemoveExclusionDialogHost } from "~/settings/presentation/removeDialog/components/RemoveExclusionDialogHost.js";
import { ExclusionsPagePresenterFeature } from "../feature.js";
import { ExclusionsEmpty } from "./ExclusionsEmpty.js";
import { ExclusionsHeader } from "./ExclusionsHeader.js";
import { ExclusionsLoadError } from "./ExclusionsLoadError.js";
import { ExclusionsLoading } from "./ExclusionsLoading.js";
import { ExclusionsNamesBanner } from "./ExclusionsNamesBanner.js";
import { ExclusionsNoAccess } from "./ExclusionsNoAccess.js";
import { ExclusionsRulesCard } from "./ExclusionsRulesCard.js";
import { ExclusionsTable } from "./ExclusionsTable.js";
import { ExclusionsToolbar } from "./ExclusionsToolbar.js";

/*
 * The Reviewer exclusions page (R322, R329). The view passes the viewer's `editor` permission and
 * time zone to `init` (R337) and renders only the presenter's view model. The open dialog is
 * `vm.dialog`; its host is keyed by kind and user, so a switch (Remove entry) remounts it.
 */
export const ExclusionsPage = createReactiveComponent(function ExclusionsPage() {
    const { presenter } = useFeature(ExclusionsPagePresenterFeature);
    const permission = useWorkflowsPermission();
    const canManage = permission.editor;

    useEffect(() => {
        const timeZone = resolveViewerTimeZone();
        void presenter.init({ canManage, timeZone });
        return () => {
            presenter.dispose();
        };
    }, [presenter, canManage]);

    const vm = presenter.vm;

    let body: React.ReactNode = null;
    if (vm.status === "loading") {
        body = <ExclusionsLoading />;
    } else if (vm.status === "failed") {
        body = <ExclusionsLoadError onRetry={() => presenter.reload()} />;
    } else if (vm.status === "noAccess") {
        body = <ExclusionsNoAccess />;
    } else {
        let namesBanner: React.ReactNode = null;
        if (vm.namesFailed) {
            namesBanner = <ExclusionsNamesBanner onRetry={() => presenter.retryNames()} />;
        }

        let list: React.ReactNode = <ExclusionsTable rows={vm.rows} presenter={presenter} />;
        if (vm.empty !== null) {
            list = <ExclusionsEmpty empty={vm.empty} onAdd={() => presenter.openAdd()} />;
        }

        body = (
            <>
                {namesBanner}
                <ExclusionsRulesCard />
                <ExclusionsToolbar
                    tab={vm.tab}
                    tabs={vm.tabs}
                    filter={vm.filter}
                    presenter={presenter}
                />
                {list}
            </>
        );
    }

    const request = vm.dialog;
    let dialog: React.ReactNode = null;
    if (request !== null && request.kind === "remove" && request.userId !== null) {
        dialog = (
            <RemoveExclusionDialogHost
                key={`remove:${request.userId}`}
                source={presenter}
                userId={request.userId}
            />
        );
    } else if (request !== null && request.kind !== "remove") {
        dialog = (
            <ExclusionDialogHost
                key={`${request.kind}:${request.userId ?? ""}`}
                source={presenter}
                mode={request.kind}
                userId={request.userId}
            />
        );
    }

    return (
        <div data-testid="exclusions-page" className="flex flex-col gap-md p-lg">
            <ExclusionsHeader canAdd={vm.canAdd} onAdd={() => presenter.openAdd()} />
            {body}
            {dialog}
        </div>
    );
});
