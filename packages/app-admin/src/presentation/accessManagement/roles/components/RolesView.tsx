import React, { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import orderBy from "lodash/orderBy.js";
import { useFeature } from "@webiny/app";
import { Bind, Form, useForm, useGenerateSlug } from "@webiny/form";
import { validation } from "@webiny/validation";
import {
    SplitView,
    LeftPanel,
    RightPanel,
    SimpleForm,
    SimpleFormHeader,
    SimpleFormContent,
    SimpleFormFooter,
    EmptyView,
    Permissions,
    useSnackbar,
    useConfirmationDialog,
    SearchUI,
    useRouter,
    useRoute
} from "~/index.js";
import {
    Alert,
    Button,
    DataList,
    DataListModal,
    DeleteIcon,
    Grid,
    IconButton,
    Input,
    List,
    OverlayLoader,
    Select,
    Textarea,
    Tooltip
} from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as CopyIcon } from "@webiny/icons/content_copy.svg";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { RolesPresenterFeature } from "../feature.js";
import { Routes } from "../../routes.js";
import type { Role } from "~/features/accessManagement/types.js";

const SORTERS = [
    { label: "Newest to oldest", sorter: "createdOn_DESC" },
    { label: "Oldest to newest", sorter: "createdOn_ASC" },
    { label: "Name A-Z", sorter: "name_ASC" },
    { label: "Name Z-A", sorter: "name_DESC" }
];

const deserializeSorters = (data: string): [string, "asc" | "desc"] => {
    const [field, order] = data.split("_");
    return [field, order.toLowerCase() === "asc" ? "asc" : "desc"];
};

const RolesDataList = observer(({ activeId }: { activeId: string | undefined }) => {
    const { presenter } = useFeature(RolesPresenterFeature);
    const { goToRoute } = useRouter();
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog({
        dataTestId: "default-data-list.delete-dialog"
    });

    const [filter, setFilter] = useState("");
    const [sort, setSort] = useState(SORTERS[0].sorter);

    const roles = presenter.list.vm.rows;
    const loading = presenter.list.vm.pagination.loading;

    const filteredData = useMemo(() => {
        if (filter === "") {
            return roles;
        }
        const lc = filter.toLowerCase();
        return roles.filter(
            (r: Role) =>
                r.name.toLowerCase().includes(lc) ||
                r.slug.toLowerCase().includes(lc) ||
                (r.description && r.description.toLowerCase().includes(lc))
        );
    }, [roles, filter]);

    const sortedData = useMemo(() => {
        if (!sort) {
            return filteredData;
        }
        const [key, order] = deserializeSorters(sort);
        return orderBy(filteredData, [key], [order]);
    }, [filteredData, sort]);

    const deleteItem = useCallback(
        (item: Role) => {
            showConfirmation(async () => {
                try {
                    await presenter.deleteRole(item.id);
                    showSnackbar(`Role "${item.slug}" deleted.`);
                    if (activeId === item.id) {
                        goToRoute(Routes.Roles.List);
                    }
                } catch (e: any) {
                    showSnackbar(e.message);
                }
            });
        },
        [activeId]
    );

    return (
        <DataList
            title={"Roles"}
            actions={
                <Button
                    text={"New"}
                    icon={<AddIcon />}
                    size={"sm"}
                    className={"ml-xs"}
                    data-testid="new-record-button"
                    onClick={() => goToRoute(Routes.Roles.List, { new: true })}
                />
            }
            data={sortedData}
            loading={loading}
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={"Search roles..."}
                />
            }
            modalOverlay={
                <DataListModal.Content>
                    <Grid>
                        <Grid.Column span={12}>
                            <Select
                                value={sort}
                                onChange={setSort}
                                label={"Sort by"}
                                options={SORTERS.map(({ label, sorter: value }) => ({
                                    label,
                                    value
                                }))}
                            />
                        </Grid.Column>
                    </Grid>
                </DataListModal.Content>
            }
            modalOverlayAction={<DataListModal.Trigger data-testid={"default-data-list.filter"} />}
        >
            {({ data }: { data: Role[] }) => (
                <List data-testid="default-data-list">
                    {data.map(item => (
                        <List.Item
                            key={item.id}
                            selected={item.id === activeId}
                            title={item.name}
                            description={item.description}
                            onClick={() => goToRoute(Routes.Roles.List, { id: item.id })}
                            actions={
                                item.system || item.plugin ? (
                                    <Tooltip
                                        content={
                                            item.system
                                                ? "Cannot delete system roles."
                                                : "Cannot delete roles registered via extensions."
                                        }
                                        trigger={<DeleteIcon disabled />}
                                    />
                                ) : (
                                    <DeleteIcon
                                        onClick={() => deleteItem(item)}
                                        data-testid={"default-data-list.delete"}
                                    />
                                )
                            }
                        />
                    ))}
                </List>
            )}
        </DataList>
    );
});

interface FormContentProps {
    pluginRole: boolean;
    canModifyRole: boolean;
    newEntry: boolean;
}

const FormContent = ({ pluginRole, canModifyRole, newEntry }: FormContentProps) => {
    const form = useForm();
    const { generateSlug } = useGenerateSlug(form, "name", "slug");

    return (
        <Grid>
            {pluginRole ? (
                <Grid.Column span={12}>
                    <Alert type={"warning"} title={"Permissions are locked"}>
                        This role is registered via an extension, and cannot be modified.
                    </Alert>
                </Grid.Column>
            ) : null}
            <Grid.Column span={6}>
                <Bind name="name" validators={validation.create("required,minLength:1")}>
                    <Input
                        required
                        label={"Name"}
                        disabled={!canModifyRole}
                        onBlur={generateSlug}
                        data-testid="admin.am.role.new.name"
                    />
                </Bind>
            </Grid.Column>
            <Grid.Column span={6}>
                <Bind name="slug" validators={validation.create("required,minLength:1")}>
                    <Input
                        required
                        disabled={!canModifyRole || !newEntry}
                        label={"Slug"}
                        data-testid="admin.am.role.new.slug"
                    />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind
                    name="description"
                    validators={validation.create("maxLength:500")}
                    defaultValue={""}
                >
                    <Textarea
                        label={"Description"}
                        rows={3}
                        disabled={!canModifyRole}
                        data-testid="admin.am.role.new.description"
                    />
                </Bind>
            </Grid.Column>
        </Grid>
    );
};

const RolesForm = observer(
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

        const onSubmit = useCallback(
            async (formData: Record<string, any>) => {
                if (!formData.permissions || !formData.permissions.length) {
                    showSnackbar("You must configure permissions before saving!", {
                        timeout: 60000,
                        dismissesOnAction: true
                    });
                    return;
                }

                const role = await presenter.save(formData);
                if (role) {
                    if (!vm.selectedRole || vm.selectedRole.id !== role.id) {
                        goToRoute(Routes.Roles.List, { id: role.id });
                    }
                    showSnackbar("Role saved successfully!");
                }
            },
            [presenter, vm.selectedRole]
        );

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

        const data = vm.selectedRole || {};
        const systemRole =
            vm.selectedRole !== null &&
            (vm.selectedRole.slug === "full-access" || vm.selectedRole.system === true);

        return (
            <Form data={data} onSubmit={onSubmit}>
                {({ data, form, Bind }) => (
                    <SimpleForm size={"lg"}>
                        {(vm.loading || vm.saving) && <OverlayLoader />}
                        <SimpleFormHeader title={data.name ? data.name : "Untitled"} />
                        <SimpleFormContent>
                            <FormContent
                                pluginRole={!!(vm.selectedRole && vm.selectedRole.plugin)}
                                canModifyRole={vm.canModify}
                                newEntry={newEntry}
                            />
                        </SimpleFormContent>
                        <SimpleFormHeader title={"Permissions"} rounded={false}>
                            <div className={"flex justify-end"}>
                                <Tooltip
                                    content="Copy permissions as JSON"
                                    trigger={
                                        <IconButton
                                            variant={"ghost"}
                                            icon={<CopyIcon />}
                                            onClick={() => {
                                                navigator.clipboard.writeText(
                                                    JSON.stringify(data.permissions, null, 2)
                                                );
                                                showSnackbar("JSON data copied to clipboard.");
                                            }}
                                        />
                                    }
                                />
                            </div>
                        </SimpleFormHeader>
                        <SimpleFormContent>
                            {systemRole ? (
                                <Grid.Column span={12}>
                                    <Alert type={"warning"} title={"Permissions are locked"}>
                                        This is a protected system role and you can&apos;t modify its
                                        permissions.
                                    </Alert>
                                </Grid.Column>
                            ) : null}
                            <Grid>
                                {vm.canModify ? (
                                    <Grid.Column span={12}>
                                        <Bind name={"permissions"} defaultValue={[]}>
                                            {bind => (
                                                <Permissions id={data.id || "new"} {...bind} />
                                            )}
                                        </Bind>
                                    </Grid.Column>
                                ) : null}
                            </Grid>
                        </SimpleFormContent>
                        <SimpleFormFooter>
                            {vm.canModify && (
                                <>
                                    <Button
                                        variant={"secondary"}
                                        text={"Cancel"}
                                        onClick={() => goToRoute(Routes.Roles.List)}
                                    />
                                    <Button
                                        text={"Save"}
                                        data-testid="admin.am.role.new.save"
                                        onClick={ev => form.submit(ev)}
                                    />
                                </>
                            )}
                        </SimpleFormFooter>
                    </SimpleForm>
                )}
            </Form>
        );
    }
);

export const RolesView = observer(() => {
    const { presenter } = useFeature(RolesPresenterFeature);
    const { route } = useRoute(Routes.Roles.List);

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    return (
        <SplitView>
            <LeftPanel>
                <RolesDataList activeId={route.params.id} />
            </LeftPanel>
            <RightPanel>
                <RolesForm newEntry={route.params.new === true} id={route.params.id} />
            </RightPanel>
        </SplitView>
    );
});
