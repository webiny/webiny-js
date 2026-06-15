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
    RolesMultiAutocomplete,
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
    Input,
    List,
    OverlayLoader,
    Select,
    Textarea,
    Tooltip
} from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { TeamsPresenterFeature } from "../feature.js";
import { Routes } from "../../routes.js";
import type { Team } from "~/features/accessManagement/types.js";

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

const TeamsDataList = observer(({ activeId }: { activeId: string | undefined }) => {
    const { presenter } = useFeature(TeamsPresenterFeature);
    const { goToRoute } = useRouter();
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog({
        dataTestId: "default-data-list.delete-dialog"
    });

    const [filter, setFilter] = useState("");
    const [sort, setSort] = useState(SORTERS[0].sorter);

    const teams = presenter.list.vm.rows;
    const loading = presenter.list.vm.pagination.loading;

    const filteredData = useMemo(() => {
        if (filter === "") {
            return teams;
        }
        const lc = filter.toLowerCase();
        return teams.filter(
            (t: Team) =>
                t.name.toLowerCase().includes(lc) ||
                t.slug.toLowerCase().includes(lc) ||
                (t.description && t.description.toLowerCase().includes(lc))
        );
    }, [teams, filter]);

    const sortedData = useMemo(() => {
        if (!sort) {
            return filteredData;
        }
        const [key, order] = deserializeSorters(sort);
        return orderBy(filteredData, [key], [order]);
    }, [filteredData, sort]);

    const deleteItem = useCallback(
        (item: Team) => {
            showConfirmation(async () => {
                try {
                    await presenter.deleteTeam(item.id);
                    showSnackbar(`Team "${item.slug}" deleted.`);
                    if (activeId === item.id) {
                        goToRoute(Routes.Teams.List);
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
            title={"Teams"}
            actions={
                <Button
                    text={"New"}
                    icon={<AddIcon />}
                    size={"sm"}
                    className={"ml-xs"}
                    data-testid="new-record-button"
                    onClick={() => goToRoute(Routes.Teams.List, { new: true })}
                />
            }
            data={sortedData}
            loading={loading}
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={"Search teams..."}
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
            {({ data }: { data: Team[] }) => (
                <List data-testid="default-data-list">
                    {data.map(item => (
                        <List.Item
                            key={item.id}
                            selected={item.id === activeId}
                            title={item.name}
                            description={item.description}
                            onClick={() => goToRoute(Routes.Teams.List, { id: item.id })}
                            actions={
                                item.system || item.plugin ? (
                                    <Tooltip
                                        content={
                                            item.system
                                                ? "Cannot delete system teams."
                                                : "Cannot delete teams registered via extensions."
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
    systemTeam: boolean;
    pluginTeam: boolean;
    canModifyTeam: boolean;
    newEntry: boolean;
}

const FormContent = ({ systemTeam, pluginTeam, canModifyTeam, newEntry }: FormContentProps) => {
    const form = useForm();
    const { generateSlug } = useGenerateSlug(form, "name", "slug");

    return (
        <Grid>
            {systemTeam ? (
                <Grid.Column span={12}>
                    <Alert type={"info"} title={"Permissions are locked"}>
                        This is a protected system team and you can&apos;t modify its permissions.
                    </Alert>
                </Grid.Column>
            ) : null}
            {pluginTeam ? (
                <Grid.Column span={12}>
                    <Alert type={"info"} title={"Important"}>
                        This team is registered via an extension, and cannot be modified.
                    </Alert>
                </Grid.Column>
            ) : null}
            <Grid.Column span={6}>
                <Bind name="name" validators={validation.create("required,minLength:1")}>
                    <Input
                        required
                        onBlur={generateSlug}
                        disabled={!canModifyTeam}
                        label={"Name"}
                        data-testid="admin.am.team.new.name"
                    />
                </Bind>
            </Grid.Column>
            <Grid.Column span={6}>
                <Bind name="slug" validators={validation.create("required,minLength:1")}>
                    <Input
                        required
                        disabled={!canModifyTeam || !newEntry}
                        label={"Slug"}
                        data-testid="admin.am.team.new.slug"
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
                        disabled={!canModifyTeam}
                        label={"Description"}
                        rows={3}
                        data-testid="admin.am.team.new.description"
                    />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name="roles" validators={validation.create("required")}>
                    <RolesMultiAutocomplete
                        disabled={!canModifyTeam}
                        label={"Roles"}
                        data-testid="admin.am.team.new.roles"
                    />
                </Bind>
            </Grid.Column>
        </Grid>
    );
};

const TeamsForm = observer(
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

        const onSubmit = useCallback(
            async (formData: Record<string, any>) => {
                const team = await presenter.save(formData);
                if (team) {
                    if (!vm.selectedTeam || vm.selectedTeam.id !== team.id) {
                        goToRoute(Routes.Teams.List, { id: team.id });
                    }
                    showSnackbar("Team saved successfully!");
                }
            },
            [presenter, vm.selectedTeam]
        );

        if (!vm.showForm) {
            return (
                <EmptyView
                    icon={<SettingsIcon />}
                    title={
                        "Click on the left side list to display team details or create a..."
                    }
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

        const data = vm.selectedTeam || {};

        return (
            <Form data={data} onSubmit={onSubmit}>
                {({ data, form }) => (
                    <SimpleForm>
                        {(vm.loading || vm.saving) && <OverlayLoader />}
                        <SimpleFormHeader title={data.name ? data.name : "Untitled"} />
                        <SimpleFormContent>
                            <FormContent
                                systemTeam={!!(vm.selectedTeam && vm.selectedTeam.system)}
                                pluginTeam={!!(vm.selectedTeam && vm.selectedTeam.plugin)}
                                canModifyTeam={vm.canModify}
                                newEntry={newEntry}
                            />
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
                                    onClick={ev => form.submit(ev)}
                                />
                            )}
                        </SimpleFormFooter>
                    </SimpleForm>
                )}
            </Form>
        );
    }
);

export const TeamsView = observer(() => {
    const { presenter } = useFeature(TeamsPresenterFeature);
    const { route } = useRoute(Routes.Teams.List);

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    return (
        <SplitView>
            <LeftPanel>
                <TeamsDataList activeId={route.params.id} />
            </LeftPanel>
            <RightPanel>
                <TeamsForm newEntry={route.params.new === true} id={route.params.id} />
            </RightPanel>
        </SplitView>
    );
});
