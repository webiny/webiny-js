import React, { useCallback, useState } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { TrashBinFeature } from "@webiny/app-admin/presentation/trashBin/feature.js";
import { TrashBinOverlay } from "@webiny/app-admin/presentation/trashBin/components/TrashBinOverlay.js";
import { Sidebar } from "@webiny/admin-ui";
import { ReactComponent as Delete } from "@webiny/icons/delete.svg";
import { useModel } from "@webiny/app-headless-cms-common";

export const CmsTrashBin = observer(() => {
    const [open, setOpen] = useState(false);
    const { model } = useModel();

    const { presenter } = useFeature(TrashBinFeature);

    const handleOpen = useCallback(() => {
        presenter.init({
            nameColumnId: model.titleFieldId || "id"
        });

        setOpen(true);
    }, [model, presenter]);

    const handleClose = useCallback(async () => {
        setOpen(false);
        presenter.dispose();
    }, [presenter]);

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
                    title={`Trash - ${model.name}`}
                    onExited={handleClose}
                />
            ) : null}
        </>
    );
});
