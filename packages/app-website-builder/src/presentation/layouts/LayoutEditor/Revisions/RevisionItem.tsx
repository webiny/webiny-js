import React from "react";
import { DropdownMenu, IconButton, List, Text } from "@webiny/admin-ui";
import { useDialogs, useRouter } from "@webiny/app-admin";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as PublishIcon } from "@webiny/icons/visibility.svg";
import { ReactComponent as UnpublishIcon } from "@webiny/icons/visibility_off.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { Routes } from "~/routes.js";
import type { LayoutRevisionsPresenter } from "./abstractions.js";
import { RevisionIcon } from "./RevisionIcon.js";

const formatDate = (date: string | null) => {
    if (!date) {
        return "";
    }
    const value = new Date(date);
    return isNaN(value.getTime()) ? "" : value.toLocaleString();
};

interface RevisionItemProps {
    presenter: LayoutRevisionsPresenter.Interface;
    item: LayoutRevisionsPresenter.ItemViewModel;
}

export const RevisionItem = ({ presenter, item }: RevisionItemProps) => {
    const { goToRoute } = useRouter();
    const { showDialog } = useDialogs();
    const { revision } = item;

    const open = (id: string) => {
        presenter.openDrawer(false);
        goToRoute(Routes.Layouts.Editor, { id });
    };

    const confirm = (title: string, content: string, onAccept: () => Promise<unknown>) => {
        showDialog({
            title,
            content: <Text>{content}</Text>,
            acceptLabel: "Confirm",
            cancelLabel: "Cancel",
            onAccept: async () => {
                await onAccept();
            }
        });
    };

    return (
        <List.Item
            icon={<RevisionIcon revision={revision} />}
            title={item.label}
            description={
                <Text as={"div"} size={"sm"}>
                    {`Last saved by ${revision.savedBy?.displayName ?? revision.createdBy?.displayName ?? "unknown"} on ${formatDate(revision.savedOn)}`}
                </Text>
            }
            actions={
                <DropdownMenu
                    trigger={
                        <IconButton
                            variant={"ghost"}
                            size={"sm"}
                            iconSize={"lg"}
                            icon={<MoreVerticalIcon />}
                        />
                    }
                >
                    {item.canCreateFrom ? (
                        <DropdownMenu.Item
                            icon={<AddIcon />}
                            text={"New revision from this one"}
                            onClick={async () => {
                                const created = await presenter.createRevisionFrom(revision);
                                if (created) {
                                    open(created.id);
                                }
                            }}
                        />
                    ) : null}
                    <DropdownMenu.Item
                        icon={<EditIcon />}
                        text={item.canEdit ? "Edit revision" : "View revision"}
                        onClick={() => open(revision.id)}
                    />
                    {item.canPublish ? (
                        <DropdownMenu.Item
                            icon={<PublishIcon />}
                            text={"Publish revision"}
                            onClick={() =>
                                confirm(
                                    "Publish revision",
                                    `You are about to publish revision #${revision.version}. Pages using this layout are rendered in it. Are you sure you want to continue?`,
                                    () => presenter.publish(revision)
                                )
                            }
                        />
                    ) : null}
                    {item.canUnpublish ? (
                        <DropdownMenu.Item
                            icon={<UnpublishIcon />}
                            text={"Unpublish revision"}
                            onClick={() =>
                                confirm(
                                    "Unpublish revision",
                                    `You are about to unpublish revision #${revision.version}. Pages can't use the layout until a revision is published again. Are you sure you want to continue?`,
                                    () => presenter.unpublish(revision)
                                )
                            }
                        />
                    ) : null}
                    {item.canDelete ? (
                        <>
                            <DropdownMenu.Separator />
                            <DropdownMenu.Item
                                icon={<DeleteIcon />}
                                text={"Delete revision"}
                                variant={"destructive"}
                                onClick={() =>
                                    confirm(
                                        "Delete revision",
                                        `You are about to delete revision #${revision.version}. This can't be undone. Are you sure you want to continue?`,
                                        () => presenter.deleteRevision(revision)
                                    )
                                }
                            />
                        </>
                    ) : null}
                </DropdownMenu>
            }
        />
    );
};
