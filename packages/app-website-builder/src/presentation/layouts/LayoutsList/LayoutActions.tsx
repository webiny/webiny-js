import React from "react";
import { DropdownMenu, IconButton } from "@webiny/admin-ui";
import { useDialogs, useRouter } from "@webiny/app-admin";
import { ReactComponent as MoreIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as DuplicateIcon } from "@webiny/icons/content_copy.svg";
import { ReactComponent as TranslateIcon } from "@webiny/icons/translate.svg";
import { ReactComponent as DefaultIcon } from "@webiny/icons/star.svg";
import { ReactComponent as NotDefaultIcon } from "@webiny/icons/star_border.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import type { Layout } from "~/features/layouts/index.js";
import { Routes } from "~/routes.js";
import { LayoutIdentity } from "~/domain/Layout/index.js";
import { HasPermission } from "~/presentation/security/HasPermission.js";
import type { LayoutsListPresenter } from "./abstractions.js";

interface LayoutActionsProps {
    presenter: LayoutsListPresenter.Interface;
    layout: Layout;
    row?: LayoutsListPresenter.RowViewModel;
    onTranslate?: () => void;
}

export const LayoutActions = ({ presenter, layout, row, onTranslate }: LayoutActionsProps) => {
    const { goToRoute } = useRouter();
    const { showDialog } = useDialogs();
    const identity = LayoutIdentity.from(layout);
    const title = identity.title();
    const isSource = identity.isSource();

    const confirmDelete = () => {
        showDialog({
            title: isSource ? "Delete layout" : "Delete language version",
            icon: <DeleteIcon />,
            content: presenter.getDeleteConfirmation(layout),
            acceptLabel: "Delete",
            cancelLabel: "Cancel",
            onAccept: async () => {
                await presenter.delete(layout);
            }
        });
    };

    return (
        <DropdownMenu
            trigger={
                <IconButton
                    variant={"ghost"}
                    size={"sm"}
                    icon={<MoreIcon />}
                    aria-label={
                        isSource
                            ? `Actions for ${title}`
                            : `Actions for ${title} (${layout.properties.language})`
                    }
                />
            }
        >
            <DropdownMenu.Item
                icon={<EditIcon />}
                text={"Edit"}
                onClick={() => goToRoute(Routes.Layouts.Editor, { id: layout.id })}
            />
            {isSource ? (
                <HasPermission entity={"page"} action={"create"}>
                    <DropdownMenu.Item
                        icon={<DuplicateIcon />}
                        text={"Duplicate"}
                        onClick={() => void presenter.duplicate(layout)}
                    />
                    {row && row.translatableLanguages.length > 0 && onTranslate ? (
                        <DropdownMenu.Item
                            icon={<TranslateIcon />}
                            text={"Translate"}
                            onClick={onTranslate}
                        />
                    ) : null}
                </HasPermission>
            ) : null}
            {row && isSource ? (
                <HasPermission entity={"page"} action={"edit"}>
                    {row.isDefault ? (
                        <DropdownMenu.Item
                            icon={<NotDefaultIcon />}
                            text={"Remove as default"}
                            onClick={() => void presenter.setDefault(null)}
                        />
                    ) : (
                        <DropdownMenu.Item
                            icon={<DefaultIcon />}
                            text={"Set as default"}
                            disabled={!row.canSetDefault}
                            onClick={() => void presenter.setDefault(layout)}
                        />
                    )}
                </HasPermission>
            ) : null}
            <HasPermission entity={"page"} action={"delete"}>
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                    icon={<DeleteIcon />}
                    text={"Delete"}
                    variant={"destructive"}
                    onClick={confirmDelete}
                />
            </HasPermission>
        </DropdownMenu>
    );
};
