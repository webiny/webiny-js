import React from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { SimpleForm } from "~/index.js";
import { SimpleFormHeader } from "~/index.js";
import { SimpleFormContent } from "~/index.js";
import { SimpleFormFooter } from "~/index.js";
import { EmptyView } from "~/index.js";
import { useSnackbar } from "~/index.js";
import { useRouter } from "~/index.js";
import { FormErrors } from "~/index.js";
import { FormView } from "~/features/formModel/FormView.js";
import { Alert } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { OverlayLoader } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { TeamsPresenterFeature } from "../feature.js";
import { Routes } from "../../routes.js";
import type { Team } from "~/features/accessManagement/types.js";
import { AssumePermissionsButton } from "~/presentation/assumePermissions/components/AssumePermissionsButton.js";
import type { AssumePermissionsPresenter } from "~/presentation/assumePermissions/abstractions.js";
import { createReactiveComponent } from "~/presentation/createReactiveComponent.js";

function formTitle(record: Team | null): string {
    if (!record || !record.name) {
        return "Untitled";
    }
    return record.name;
}

/*
 * Only a saved team can be previewed. While the form loads, `selectedTeam` can still be the team
 * that was open before, so there is no target until loading is done.
 */
function toViewAsTarget(
    team: Team | null,
    loading: boolean
): AssumePermissionsPresenter.Target | null {
    if (!team || loading) {
        return null;
    }

    return { type: "team", id: team.id, name: team.name };
}

export const TeamsForm = createReactiveComponent(
    ({ newEntry, id }: { newEntry: boolean; id: string | undefined }) => {
        const { presenter } = useFeature(TeamsPresenterFeature);
        const { goToRoute } = useRouter();
        const { showSnackbar } = useSnackbar();
        const { vm } = presenter;

        useEffect(() => {
            if (id) {
                presenter.selectTeam(id);
            } else if (newEntry) {
                presenter.createNew();
            } else {
                presenter.deselect();
            }
        }, [id, newEntry]);

        const handleSave = useCallback(async () => {
            try {
                const team = await presenter.save();
                if (team) {
                    if (!vm.selectedTeam || vm.selectedTeam.id !== team.id) {
                        goToRoute(Routes.Teams.List, { id: team.id });
                    }
                    showSnackbar("Team saved successfully!");
                }
            } catch (e: any) {
                showSnackbar(e.message);
            }
        }, [presenter, vm.selectedTeam]);

        if (!vm.showForm) {
            return (
                <EmptyView
                    icon={<SettingsIcon />}
                    title={"Click on the left side list to display team details or create a..."}
                    action={
                        <Button
                            text={"New Team"}
                            icon={<AddIcon />}
                            data-testid="new-record-button"
                            onClick={() => goToRoute(Routes.Teams.List, { new: true })}
                        />
                    }
                />
            );
        }

        const viewAsTarget = toViewAsTarget(vm.selectedTeam, vm.loading);

        return (
            <SimpleForm>
                {vm.loading || vm.saving ? <OverlayLoader /> : null}
                <SimpleFormHeader title={formTitle(vm.selectedTeam)}>
                    <div className={"flex items-center justify-end"}>
                        <AssumePermissionsButton target={viewAsTarget} />
                    </div>
                </SimpleFormHeader>
                <SimpleFormContent>
                    {vm.selectedTeam && vm.selectedTeam.system && (
                        <Alert type={"info"} title={"Permissions are locked"}>
                            This is a protected system team and you can&apos;t modify its
                            permissions.
                        </Alert>
                    )}
                    {vm.selectedTeam && vm.selectedTeam.plugin && (
                        <Alert type={"info"} title={"Important"}>
                            This team is registered via an extension, and cannot be modified.
                        </Alert>
                    )}
                    <FormErrors form={vm.form} className={"mb-md"} />
                    <FormView name={"Team"} form={vm.form} />
                </SimpleFormContent>
                <SimpleFormFooter>
                    <Button
                        variant={"secondary"}
                        text={"Cancel"}
                        onClick={() => goToRoute(Routes.Teams.List)}
                    />
                    {vm.canModify && (
                        <Button
                            text={"Save"}
                            data-testid="admin.am.team.new.save"
                            onClick={handleSave}
                        />
                    )}
                </SimpleFormFooter>
            </SimpleForm>
        );
    }
);
