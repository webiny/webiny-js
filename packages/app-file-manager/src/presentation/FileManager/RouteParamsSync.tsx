import React from "react";
import { RouteParamsSync as GenericRouteParamsSync } from "@webiny/app/presentation/router/components/RouteParamsSync.js";
import { useFileManagerPresenter } from "~/presentation/FileList/FileManagerPresenterProvider.js";
import { Routes } from "~/routes.js";

export const RouteParamsSync = () => {
    const presenter = useFileManagerPresenter();

    return (
        <GenericRouteParamsSync
            route={Routes.List}
            fields={fields => [
                fields.create<string>({
                    param: "folderId",
                    read: () => presenter.vm.folders.currentFolderId ?? undefined,
                    write: value => {
                        presenter.actions.folders.selectFolder(value ?? null);
                    }
                }),
                fields.create<string>({
                    param: "search",
                    read: () => presenter.vm.list.search || undefined,
                    write: value => {
                        if (value) {
                            presenter.actions.search.set(value);
                        } else {
                            presenter.actions.search.clear();
                        }
                    }
                })
            ]}
        />
    );
};
