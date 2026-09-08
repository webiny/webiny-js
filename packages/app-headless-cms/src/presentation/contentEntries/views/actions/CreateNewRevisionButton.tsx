import React from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "@webiny/app";
import { useRoute } from "@webiny/app-admin";
import { Button, useToast } from "@webiny/admin-ui";
import { usePermission } from "~/admin/hooks/usePermission.js";
import { useContentEntryFormPresenter } from "~/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { ReactComponent as NewRevisionIcon } from "@webiny/icons/add.svg";
import { Routes } from "~/routes.js";

export const CreateNewRevisionButton = observer(() => {
    const { canEdit } = usePermission();
    const presenter = useContentEntryFormPresenter();
    const { showSuccessToast } = useToast();
    const { goToRoute } = useRouter();
    const { route } = useRoute(Routes.ContentEntries.List);

    if (
        !presenter.vm.entry ||
        !presenter.vm.canCreateNewRevision ||
        !canEdit(presenter.vm.entry, "cms.contentEntry")
    ) {
        return null;
    }

    const handleSave = async () => {
        const model = presenter.vm.model;
        const isPublishable = !model.tags.includes("$publishing:false");
        const previousId = presenter.vm.entry?.id;

        const saved = await presenter.saveRevision({ skipValidation: isPublishable });
        if (!saved) {
            return;
        }

        const newId = presenter.vm.entry?.id;
        if (newId && newId !== previousId) {
            goToRoute(Routes.ContentEntries.List, { ...route.params, id: newId });
        }

        showSuccessToast({
            title: `A new revision of "${presenter.vm.entry?.meta?.title || "Entry"}" was created!`
        });
    };

    return (
        <Button
            variant={"secondary"}
            text={"New Revision"}
            onClick={handleSave}
            icon={<NewRevisionIcon />}
        />
    );
});
