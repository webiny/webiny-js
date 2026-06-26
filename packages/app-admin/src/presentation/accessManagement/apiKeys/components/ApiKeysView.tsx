import React, { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import orderBy from "lodash/orderBy.js";
import { useFeature } from "@webiny/app";
import {
    SplitView,
    LeftPanel,
    RightPanel,
    SimpleForm,
    SimpleFormHeader,
    SimpleFormContent,
    SimpleFormFooter,
    EmptyView,
    useSnackbar,
    useConfirmationDialog,
    SearchUI,
    useRouter,
    useRoute
} from "~/index.js";
import { FormView } from "~/features/formModel/FormView.js";
import {
    Button,
    DataList,
    DataListModal,
    DeleteIcon,
    Grid,
    Icon,
    IconButton,
    List,
    OverlayLoader,
    Select,
    Tooltip,
    useToast
} from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as CopyIcon } from "@webiny/icons/content_copy.svg";
import { ReactComponent as PasteIcon } from "@webiny/icons/content_paste.svg";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { ApiKeysPresenterFeature } from "../feature.js";
import { Routes } from "../../routes.js";
import type { ApiKey } from "~/features/accessManagement/types.js";
import type { GenericRecord } from "@webiny/app/types.js";
import { FormErrors } from "~/index.js";

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

const ApiKeysDataList = observer(({ activeId }: { activeId: string | undefined }) => {
    const { presenter } = useFeature(ApiKeysPresenterFeature);
    const { goToRoute } = useRouter();
    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog({
        dataTestId: "default-data-list.delete-dialog"
    });

    const [filter, setFilter] = useState("");
    const [sort, setSort] = useState(SORTERS[0].sorter);

    const apiKeys = presenter.list.vm.rows;
    const loading = presenter.list.vm.pagination.loading;

    const filteredData = useMemo(() => {
        if (filter === "") {
            return apiKeys;
        }
        const lc = filter.toLowerCase();
        return apiKeys.filter(
            (k: ApiKey) =>
                k.name.toLowerCase().includes(lc) ||
                k.slug.toLowerCase().includes(lc) ||
                (k.description && k.description.toLowerCase().includes(lc))
        );
    }, [apiKeys, filter]);

    const sortedData = useMemo(() => {
        if (!sort) {
            return filteredData;
        }
        const [key, order] = deserializeSorters(sort);
        return orderBy(filteredData, [key], [order]);
    }, [filteredData, sort]);

    const deleteItem = useCallback(
        (item: ApiKey) => {
            showConfirmation(async () => {
                try {
                    await presenter.deleteApiKey(item.id);
                    showSnackbar(`API key "${item.name}" deleted.`);
                    if (activeId === item.id) {
                        goToRoute(Routes.ApiKeys.List);
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
            title={"API Keys"}
            actions={
                <Button
                    text={"New"}
                    icon={<AddIcon />}
                    size={"sm"}
                    className={"ml-xs"}
                    data-testid="new-record-button"
                    onClick={() => goToRoute(Routes.ApiKeys.List, { new: true })}
                />
            }
            data={sortedData}
            loading={loading}
            search={
                <SearchUI
                    value={filter}
                    onChange={setFilter}
                    inputPlaceholder={"Search API keys..."}
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
            {({ data }: { data: ApiKey[] }) => (
                <List data-testid="default-data-list">
                    {data.map(item => (
                        <List.Item
                            key={item.id}
                            selected={item.id === activeId}
                            title={item.name}
                            description={item.description}
                            onClick={() => goToRoute(Routes.ApiKeys.List, { id: item.id })}
                            actions={
                                <DeleteIcon
                                    onClick={() => deleteItem(item)}
                                    data-testid={"default-data-list.delete"}
                                />
                            }
                        />
                    ))}
                </List>
            )}
        </DataList>
    );
});

const CopyPermissionsToJson = ({ permissions }: { permissions: GenericRecord[] }) => {
    const toast = useToast();

    return (
        <Tooltip
            content="Copy permissions as JSON"
            trigger={
                <IconButton
                    variant={"ghost"}
                    icon={<CopyIcon />}
                    onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(permissions, null, 2));
                        toast.showToast({
                            title: "JSON data copied to clipboard.",
                            icon: <Icon icon={<PasteIcon />} label={"Paste"} />
                        });
                    }}
                />
            }
        />
    );
};

const ApiKeyForm = observer(({ newEntry, id }: { newEntry: boolean; id: string | undefined }) => {
    const { presenter } = useFeature(ApiKeysPresenterFeature);
    const { goToRoute } = useRouter();
    const toast = useToast();
    const { vm } = presenter;

    useEffect(() => {
        if (id) {
            presenter.selectApiKey(id);
        } else if (newEntry) {
            presenter.createNew();
        } else {
            presenter.deselect();
        }
    }, [id, newEntry]);

    const handleSave = useCallback(async () => {
        const apiKey = await presenter.save();
        if (apiKey) {
            if (!vm.selectedApiKey || vm.selectedApiKey.id !== apiKey.id) {
                goToRoute(Routes.ApiKeys.List, { id: apiKey.id });
            }
            toast.showSuccessToast({ title: "API key saved successfully." });
        }
    }, [presenter, vm.selectedApiKey]);

    if (!vm.showForm) {
        return (
            <EmptyView
                icon={<SettingsIcon />}
                title={"Click on the left side list to display API key details or create a..."}
                action={
                    <Button
                        icon={<AddIcon />}
                        text={"New API Key"}
                        data-testid="new-record-button"
                        onClick={() => goToRoute(Routes.ApiKeys.List, { new: true })}
                    />
                }
            />
        );
    }

    const permissions = vm.selectedApiKey ? vm.selectedApiKey.permissions : [];

    return (
        <SimpleForm size={"lg"}>
            {vm.loading || vm.saving ? <OverlayLoader /> : null}
            <SimpleFormHeader
                title={vm.selectedApiKey ? vm.selectedApiKey.name || "Untitled" : "Untitled"}
            >
                <div className={"flex justify-end"}>
                    <CopyPermissionsToJson permissions={permissions} />
                </div>
            </SimpleFormHeader>
            <SimpleFormContent>
                <FormErrors form={vm.form} className={"mb-md"} />
                <FormView name={"API Key"} form={vm.form} />
            </SimpleFormContent>
            <SimpleFormFooter>
                <Button
                    variant={"secondary"}
                    text={"Cancel"}
                    onClick={() => goToRoute(Routes.ApiKeys.List)}
                    data-testid="sam.key.new.form.button.cancel"
                />
                <Button
                    text={"Save"}
                    data-testid="sam.key.new.form.button.save"
                    onClick={handleSave}
                />
            </SimpleFormFooter>
        </SimpleForm>
    );
});

export const ApiKeysView = observer(() => {
    const { presenter } = useFeature(ApiKeysPresenterFeature);
    const { route } = useRoute(Routes.ApiKeys.List);

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    return (
        <SplitView>
            <LeftPanel>
                <ApiKeysDataList activeId={route.params.id} />
            </LeftPanel>
            <RightPanel>
                <ApiKeyForm newEntry={route.params.new === true} id={route.params.id} />
            </RightPanel>
        </SplitView>
    );
});
