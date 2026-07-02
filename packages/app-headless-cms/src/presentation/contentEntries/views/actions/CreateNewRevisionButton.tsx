import React from "react";
import { observer } from "mobx-react-lite";
import { Button, useToast } from "@webiny/admin-ui";
import { usePermission } from "~/admin/hooks/usePermission.js";
import { useContentEntryFormPresenter } from "~/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { ReactComponent as NewRevisionIcon } from "@webiny/icons/add.svg";

export const CreateNewRevisionButton = observer(() => {
    const { canEdit } = usePermission();
    const presenter = useContentEntryFormPresenter();
    const { showSuccessToast } = useToast();
    
    console.log({
        entry: presenter.vm.entry,
        canCreateNewRevision: presenter.vm.canCreateNewRevision,
        canEdit: canEdit(presenter.vm.entry!, "cms.contentEntry")
    });
    
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

        const saved = await presenter.saveRevision({ skipValidation: isPublishable });
        if (!saved) {
            return;
        }
        showSuccessToast({
            title: `A new revision of "${presenter.vm.entry?.meta?.title || "Entry"}" was created!`
        });
    };

    return (
        <Button
            variant="primary"
            text={"New Revision"}
            onClick={handleSave}
            icon={<NewRevisionIcon />}
        />
    );
});
