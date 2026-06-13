import React from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "@webiny/app";
import { useRoute } from "@webiny/app-admin";
import { OptionsMenuItem } from "@webiny/app-admin";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { usePermission } from "~/admin/hooks/index.js";
import { Routes } from "~/routes.js";
import { useContentEntryFormPresenter } from "~/presentation/contentEntries/form/useContentEntryFormPresenter.js";

export const DeleteEntryMenuItem = observer(() => {
    const presenter = useContentEntryFormPresenter();
    const { canDelete } = usePermission();
    const router = useRouter();
    const { route } = useRoute(Routes.ContentEntries.List);

    const trashEntry = async () => {
        if (!presenter.vm.entry) {
            return;
        }

        const deleted = await presenter.deleteEntry();

        if (deleted) {
            presenter.reset();
            const { modelId, folderId } = route.params;
            router.goToRoute(Routes.ContentEntries.List, { modelId, folderId });
        }
    };

    if (!presenter.vm.canDelete || !canDelete(presenter.vm.entry!, "cms.contentEntry")) {
        return null;
    }

    return (
        <OptionsMenuItem
            icon={<DeleteIcon />}
            label={"Trash entry"}
            onAction={trashEntry}
            disabled={presenter.vm.loading !== null}
            data-testid={"cms.content-form.header.delete"}
            className={"text-destructive-primary! [&_svg]:fill-destructive"}
        />
    );
});
