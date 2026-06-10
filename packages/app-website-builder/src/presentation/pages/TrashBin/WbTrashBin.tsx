import React, { useCallback, useState } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { TrashBinFeature } from "@webiny/app-admin/presentation/trashBin/feature.js";
import { TrashBinOverlay } from "@webiny/app-admin/presentation/trashBin/components/TrashBinOverlay.js";
import type { TrashBinItem } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { Sidebar } from "@webiny/admin-ui";
import { ReactComponent as Delete } from "@webiny/icons/delete.svg";
import { useNavigateFolder } from "@webiny/app-aco";
import { usePermissions } from "~/presentation/security/usePermissions.js";

export const WbTrashBin = observer(() => {
    const [open, setOpen] = useState(false);
    const { canDelete } = usePermissions();
    const { navigateToFolder } = useNavigateFolder();

    const { presenter } = useFeature(TrashBinFeature);

    const handleOpen = useCallback(() => {
        presenter.init({
            nameColumnId: "properties.title"
        });
        setOpen(true);
    }, [presenter]);

    const handleClose = useCallback(() => {
        setOpen(false);
        presenter.dispose();
    }, [presenter]);

    const handleItemAfterRestore = useCallback(
        async (item: TrashBinItem) => {
            handleClose();
            if (item.location.folderId) {
                navigateToFolder(item.location.folderId);
            }
        },
        [handleClose, navigateToFolder]
    );

    if (!canDelete("page")) {
        return null;
    }

    return (
        <>
            <div className={"list-none"}>
                <Sidebar.Item
                    onClick={handleOpen}
                    text={"Trash"}
                    icon={<Sidebar.Item.Icon element={<Delete />} label={"Trash"} />}
                />
            </div>
            {open ? (
                <TrashBinOverlay
                    presenter={presenter}
                    title={"Trash - Pages"}
                    onExited={handleClose}
                    onItemAfterRestore={handleItemAfterRestore}
                />
            ) : null}
        </>
    );
});
