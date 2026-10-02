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
import { Grid } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { OverlayLoader } from "@webiny/admin-ui";
import { Tooltip } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as CopyIcon } from "@webiny/icons/content_copy.svg";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { RolesPresenterFeature } from "../feature.js";
import { Routes } from "../../routes.js";
import type { Role } from "~/features/accessManagement/types.js";
import { AssumePermissionsButton } from "~/presentation/assumePermissions/components/AssumePermissionsButton.js";
import type { AssumePermissionsPresenter } from "~/presentation/assumePermissions/abstractions.js";
import { createReactiveComponent } from "~/presentation/createReactiveComponent.js";

/*
 * Only a saved role can be previewed. While the form loads, `selectedRole` can still be the role
 * that was open before, so there is no target until loading is done.
 */
function toViewAsTarget(
    role: Role | null,
    loading: boolean
): AssumePermissionsPresenter.Target | null {
    if (!role || loading) {
        return null;
    }

    return { type: "role", id: role.id, name: role.name };
}

export const RolesForm = createReactiveComponent(
    ({ newEntry, id }: { newEntry: boolean; id: string | undefined }) => {
        const { presenter } = useFeature(RolesPresenterFeature);
        const { goToRoute } = useRouter();
        const { showSnackbar } = useSnackbar();
        const { vm } = presenter;

        useEffect(() => {
            if (id) {
                presenter.selectRole(id);
            } else if (newEntry) {
                presenter.createNew();
            } else {
                presenter.deselect();
            }
        }, [id, newEntry]);

        const handleSave = useCallback(async () => {
            try {
                const role = await presenter.save();
                if (role) {
                    if (!vm.selectedRole || vm.selectedRole.id !== role.id) {
                        goToRoute(Routes.Roles.List, { id: role.id });
                    }
                    showSnackbar("Role saved successfully!");
                }
            } catch (e: any) {
                showSnackbar(e.message);
            }
        }, [presenter, vm.selectedRole]);

        if (!vm.showForm) {
            return (
                <EmptyView
                    icon={<SettingsIcon />}
                    title={"Click on the left side list to display role details or create a..."}
                    action={
                        <Button
                            icon={<AddIcon />}
                            text={"New Role"}
                            data-testid="new-record-button"
                            onClick={() => goToRoute(Routes.Roles.List, { new: true })}
                        />
                    }
                />
            );
        }

        const viewAsTarget = toViewAsTarget(vm.selectedRole, vm.loading);

        return (
            <SimpleForm size={"lg"}>
                {vm.loading || vm.saving ? <OverlayLoader /> : null}
                <SimpleFormHeader
                    title={vm.selectedRole ? vm.selectedRole.name || "Untitled" : "Untitled"}
                >
                    <div className={"flex items-center justify-end gap-xxs"}>
                        <AssumePermissionsButton target={viewAsTarget} />
                        <Tooltip
                            content="Copy permissions as JSON"
                            trigger={
                                <IconButton
                                    variant={"ghost"}
                                    icon={<CopyIcon />}
                                    onClick={() => {
                                        const permissions = vm.selectedRole
                                            ? vm.selectedRole.permissions
                                            : [];
                                        navigator.clipboard.writeText(
                                            JSON.stringify(permissions, null, 2)
                                        );
                                        showSnackbar("JSON data copied to clipboard.");
                                    }}
                                />
                            }
                        />
                    </div>
                </SimpleFormHeader>
                <SimpleFormContent>
                    {vm.isSystemRole ? (
                        <Grid>
                            <Grid.Column span={12}>
                                <Alert type={"warning"} title={"Permissions are locked"}>
                                    This is a protected system role and you can&apos;t modify its
                                    permissions.
                                </Alert>
                            </Grid.Column>
                        </Grid>
                    ) : null}
                    {vm.selectedRole && vm.selectedRole.plugin ? (
                        <Alert type={"warning"} title={"Permissions are locked"}>
                            This role is registered via an extension, and cannot be modified.
                        </Alert>
                    ) : null}
                    <FormErrors form={vm.form} className={"mb-md"} />
                    <FormView name={"Role"} form={vm.form} />
                </SimpleFormContent>
                <SimpleFormFooter>
                    {vm.canModify ? (
                        <>
                            <Button
                                variant={"secondary"}
                                text={"Cancel"}
                                onClick={() => goToRoute(Routes.Roles.List)}
                            />
                            <Button
                                text={"Save"}
                                data-testid="admin.am.role.new.save"
                                onClick={handleSave}
                            />
                        </>
                    ) : null}
                </SimpleFormFooter>
            </SimpleForm>
        );
    }
);
