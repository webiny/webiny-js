import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import {
    ContentEntryEditorConfig,
    useContentEntryFormPresenter
} from "@webiny/app-headless-cms/exports/admin/cms/entry/editor.js";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/cell_tower.svg";
import { useApolloClient } from "@apollo/react-hooks";
import { useScheduleDialog } from "@webiny/app-scheduler";
import { usePermissions } from "~/hooks/usePermissions.js";
import { createNamespace } from "~/utils/index.js";

interface MenuItemWithIdProps {
    entryId: string;
    entryTitle: string;
    entryStatus: string;
    modelId: string;
    loading: boolean;
}

const MenuItemWithId = ({
    entryId,
    entryTitle,
    entryStatus,
    modelId,
    loading
}: MenuItemWithIdProps) => {
    const client = useApolloClient();

    const { showDialog: showSchedulerDialog } = useScheduleDialog({
        client,
        namespace: createNamespace({ modelId }),
        target: {
            id: entryId,
            title: entryTitle,
            status: entryStatus
        }
    });

    const { OptionsMenuItem } =
        ContentEntryEditorConfig.Actions.MenuItemAction.useOptionsMenuItem();

    const showDialog = useCallback(() => {
        showSchedulerDialog();
    }, [showSchedulerDialog]);

    const action = entryStatus === "published" ? "unpublish" : "publish";

    return (
        <OptionsMenuItem
            icon={<ScheduleIcon />}
            label={`Schedule ${action}`}
            onAction={showDialog}
            disabled={!entryStatus || loading}
            data-testid={"cms.content-form.header.schedule"}
        />
    );
};

export const MenuItem = observer(() => {
    const presenter = useContentEntryFormPresenter();
    const { canPublish, canUnpublish } = usePermissions();

    const { OptionsMenuItem } =
        ContentEntryEditorConfig.Actions.MenuItemAction.useOptionsMenuItem();

    const vm = presenter.vm;

    if (!vm.canPublish && !vm.canUnpublish) {
        return null;
    }

    if (!canPublish && !canUnpublish) {
        return null;
    }

    if (!vm.entry) {
        return (
            <OptionsMenuItem
                icon={<ScheduleIcon />}
                label={"Schedule"}
                onAction={() => void 0}
                disabled={true}
                data-testid={"cms.content-form.header.schedule"}
            />
        );
    }

    return (
        <MenuItemWithId
            entryId={vm.entry.id}
            entryTitle={vm.entry.meta?.title || ""}
            entryStatus={vm.entry.meta?.status || ""}
            modelId={vm.model.modelId}
            loading={vm.loading !== null}
        />
    );
});
