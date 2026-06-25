import React from "react";
import { RouteParamsSync as GenericRouteParamsSync } from "@webiny/app/presentation/router/components/RouteParamsSync.js";
import { Routes } from "~/routes.js";
import { createLastVisitedFolderKey } from "~/admin/constants.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/list/useContentEntriesPresenter.js";

interface RouteParamsSyncProps {
    modelId: string;
}

export const RouteParamsSync = ({ modelId }: RouteParamsSyncProps) => {
    const presenter = useContentEntriesPresenter();

    return (
        <GenericRouteParamsSync
            route={Routes.ContentEntries.List}
            fields={fields => [
                fields.create<string>({
                    param: "folderId",
                    read: () => presenter.folders.vm.currentFolderId ?? undefined,
                    write: value => {
                        presenter.folders.selectFolder(value ?? null);
                    },
                    storageKey: createLastVisitedFolderKey(modelId)
                }),
                fields.create<string>({
                    param: "search",
                    read: () => presenter.list.vm.search || undefined,
                    write: value => {
                        if (value) {
                            presenter.list.actions.search.set(value);
                        } else {
                            presenter.list.actions.search.clear();
                        }
                    }
                }),
                fields.create<string>({
                    param: "id",
                    read: () => {
                        const id = presenter.vm.selectedEntryId;
                        if (id !== null && id !== "new") {
                            return id;
                        }
                        return undefined;
                    },
                    write: value => {
                        if (value && presenter.vm.selectedEntryId !== value) {
                            presenter.selectEntry(value);
                        } else if (
                            !value &&
                            presenter.vm.selectedEntryId !== null &&
                            presenter.vm.selectedEntryId !== "new"
                        ) {
                            presenter.deselectEntry();
                        }
                    }
                }),
                fields.create<boolean>({
                    param: "new",
                    read: () => {
                        if (presenter.vm.selectedEntryId === "new") {
                            return true;
                        }
                        return undefined;
                    },
                    write: value => {
                        if (value && presenter.vm.selectedEntryId !== "new") {
                            presenter.createEntry();
                        } else if (!value && presenter.vm.selectedEntryId === "new") {
                            presenter.deselectEntry();
                        }
                    }
                })
            ]}
        />
    );
};
