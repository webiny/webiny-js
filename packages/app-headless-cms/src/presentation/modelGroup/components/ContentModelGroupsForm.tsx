import React, { useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { i18n } from "@webiny/app/i18n/index.js";
import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormContent,
    SimpleFormFooter,
    EmptyView,
    useSnackbar,
    useRouter
} from "@webiny/app-admin";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { Button, OverlayLoader, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as DevicesIcon } from "@webiny/icons/devices_other.svg";
import { ModelGroupPresenterFeature } from "~/presentation/modelGroup/feature.js";
import { usePermission } from "~/admin/hooks/index.js";
import { Routes } from "~/routes.js";

const t = i18n.ns("app-headless-cms/admin/content-model-groups/form");

export const ContentModelGroupsForm = observer(
    ({ newEntry, id }: { newEntry: boolean; id: string | undefined }) => {
        const { presenter } = useFeature(ModelGroupPresenterFeature);
        const { goToRoute } = useRouter();
        const { showSnackbar } = useSnackbar();
        const { canCreate, canEdit } = usePermission();
        const { vm } = presenter;

        useEffect(() => {
            if (id) {
                presenter.selectGroup(id);
            } else if (newEntry) {
                presenter.createNew();
            } else {
                presenter.deselect();
            }
        }, [id, newEntry]);

        const handleSave = useCallback(async () => {
            const group = await presenter.save();
            if (group) {
                if (!vm.selectedGroup || vm.selectedGroup.id !== group.id) {
                    goToRoute(Routes.ContentModelGroups.List, { id: group.id });
                }
                showSnackbar(t`Content model group saved successfully!`);
            }
        }, [presenter, vm.selectedGroup]);

        if (!vm.showForm) {
            return (
                <EmptyView
                    icon={<DevicesIcon />}
                    title={t`Click on the left side list to display group details {message}`({
                        message: canCreate("cms.contentModelGroup") ? "or create a..." : ""
                    })}
                    action={
                        canCreate("cms.contentModelGroup") ? (
                            <Button
                                text={t`New Group`}
                                icon={<AddIcon />}
                                data-testid="new-record-button"
                                onClick={() =>
                                    goToRoute(Routes.ContentModelGroups.List, { new: true })
                                }
                            />
                        ) : (
                            <></>
                        )
                    }
                />
            );
        }

        return (
            <SimpleForm data-testid={"pb-content-model-groups-form"}>
                <SimpleFormHeader
                    title={
                        vm.selectedGroup
                            ? vm.selectedGroup.name || t`New content model group`
                            : t`New content model group`
                    }
                />
                {(vm.loading || vm.saving) && <OverlayLoader />}
                <SimpleFormContent>
                    <FormView name={"ContentModelGroup"} form={vm.form} />
                </SimpleFormContent>
                <SimpleFormFooter>
                    <Button
                        variant={"secondary"}
                        text={t`Cancel`}
                        onClick={() => goToRoute(Routes.ContentModelGroups.List)}
                    />
                    {vm.selectedGroup
                        ? canEdit(vm.selectedGroup, "cms.contentModelGroup") && vm.canModify
                            ? (
                                <Button
                                    variant={"primary"}
                                    text={t`Save`}
                                    onClick={handleSave}
                                    data-testid={"cms.form.group.submit"}
                                />
                            )
                            : vm.isPluginGroup
                                ? (
                                    <Tooltip
                                        content={
                                            "Content model group is registered via a plugin."
                                        }
                                        side={"bottom"}
                                        trigger={
                                            <Button
                                                disabled
                                                variant={"primary"}
                                                text={t`Save`}
                                                data-testid={"cms.form.group.submit"}
                                            />
                                        }
                                    />
                                )
                                : null
                        : (
                            <Button
                                variant={"primary"}
                                text={t`Save`}
                                onClick={handleSave}
                                data-testid={"cms.form.group.submit"}
                            />
                        )}
                </SimpleFormFooter>
            </SimpleForm>
        );
    }
);
