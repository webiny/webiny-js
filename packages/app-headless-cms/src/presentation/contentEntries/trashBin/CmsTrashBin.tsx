import React, { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useContainer, useFeature } from "@webiny/app";
import { TrashBinFeature } from "@webiny/app-admin/presentation/trashBin/feature.js";
import { TrashBinOverlay } from "@webiny/app-admin/presentation/trashBin/components/TrashBinOverlay.js";
import {
    TrashBinListGateway,
    TrashBinDeleteGateway,
    TrashBinRestoreGateway,
    TrashBinBulkActionGateway
} from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import type { ITrashBinPresenter, TrashBinItem } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { Sidebar } from "@webiny/admin-ui";
import { ReactComponent as Delete } from "@webiny/icons/delete.svg";
import { useModel } from "@webiny/app-headless-cms-common";

interface SetModelAware {
    setModel(model: any): void;
}

export const CmsTrashBin = observer(() => {
    const [open, setOpen] = useState(false);
    const { model } = useModel();
    const container = useContainer();

    const { presenter } = useFeature(TrashBinFeature) as { presenter: ITrashBinPresenter };

    const handleOpen = useCallback(() => {
        const listGateway = container.resolve(TrashBinListGateway) as unknown as SetModelAware;
        const deleteGateway = container.resolve(TrashBinDeleteGateway) as unknown as SetModelAware;
        const restoreGateway = container.resolve(TrashBinRestoreGateway) as unknown as SetModelAware;
        const bulkGateway = container.resolve(TrashBinBulkActionGateway) as unknown as SetModelAware;

        listGateway.setModel(model);
        deleteGateway.setModel(model);
        restoreGateway.setModel(model);
        bulkGateway.setModel(model);

        presenter.init({
            title: `Trash - ${model.name}`,
            nameColumnId: model.titleFieldId || "id"
        });

        setOpen(true);
    }, [model, presenter, container]);

    const handleClose = useCallback(() => {
        setOpen(false);
        presenter.dispose();
    }, [presenter]);

    const handleItemAfterRestore = useCallback(
        async (_item: TrashBinItem) => {
            handleClose();
        },
        [handleClose]
    );

    return (
        <>
            <div className={"list-none"}>
                <Sidebar.Item
                    onClick={handleOpen}
                    text={"Trash"}
                    icon={<Sidebar.Item.Icon element={<Delete />} label={"Delete"} />}
                />
            </div>
            {open ? (
                <TrashBinOverlay
                    presenter={presenter}
                    onExited={handleClose}
                    onItemAfterRestore={handleItemAfterRestore}
                />
            ) : null}
        </>
    );
});
