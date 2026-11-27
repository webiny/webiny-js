import React from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { useToast } from "@webiny/admin-ui";
import { OptionsMenuItem } from "@webiny/app-admin";
import { ReactComponent as UnpublishIcon } from "@webiny/icons/visibility_off.svg";
import { usePermission } from "~/admin/hooks/index.js";
import { useContentEntryFormPresenter } from "~/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { RevisionsListFeature } from "../../revisionsList/feature.js";

export const UnpublishEntryMenuItem = observer(() => {
    const presenter = useContentEntryFormPresenter();
    const { presenter: revisionsPresenter } = useFeature(RevisionsListFeature);
    const { canUnpublish } = usePermission();
    const toast = useToast();

    const unpublish = async () => {
        const entry = presenter.vm.entry;
        if (!entry) {
            return;
        }

        // Confirms and refreshes the revisions list, as the revisions drawer does.
        const { unpublished, error } = await revisionsPresenter.unpublishRevision(entry.id);

        if (error) {
            toast.showWarningToast({
                title: "Could not unpublish the entry.",
                description: error
            });
            return;
        }

        if (unpublished) {
            presenter.patchEntryMeta({ status: "unpublished" });
        }
    };

    if (!presenter.vm.canUnpublish || !canUnpublish("cms.contentEntry")) {
        return null;
    }

    return (
        <OptionsMenuItem
            icon={<UnpublishIcon />}
            label={"Unpublish"}
            onAction={unpublish}
            disabled={presenter.vm.loading !== null}
            data-testid={"cms.content-form.header.unpublish"}
        />
    );
});
