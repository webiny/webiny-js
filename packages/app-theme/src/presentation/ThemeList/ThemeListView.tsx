import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import type { DataTableColumns } from "@webiny/admin-ui";
import {
    Button,
    DataTable,
    DropdownMenu,
    EmptyState,
    Heading,
    IconButton,
    Separator,
    Text,
    TimeAgo,
    useToast
} from "@webiny/admin-ui";
import { useRouter } from "@webiny/app-admin";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/index.js";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as BoltIcon } from "@webiny/icons/bolt.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { HasPermission } from "~/presentation/security/HasPermission.js";
import { useThemes } from "~/presentation/useThemes.js";
import { NewThemeCopy, NewThemeDialog } from "~/presentation/NewTheme/NewThemeDialog.js";
import { PaletteStrip } from "./PaletteStrip.js";
import { ThemeStatusTag } from "./ThemeStatusTag.js";
import { Routes } from "~/routes.js";
import type { ThemeDto } from "~/features/themeGateway/index.js";

export const ThemeListView = observer(function ThemeListView() {
    const themes = useThemes();
    const { goToRoute } = useRouter();
    const toast = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        void themes.loadList();
    }, [themes]);

    const activeEntryId = themes.getActivePointer()?.entryId ?? null;
    const rows = themes.getThemes();

    const { showConfirmation: confirmDelete } = useConfirmationDialog({
        title: "Delete theme",
        message: "This removes the theme and all of its versions. It cannot be undone."
    });

    const { showConfirmation: confirmActivate } = useConfirmationDialog({
        title: "Activate this theme",
        // The highest-consequence action in the module gets a plain statement of what happens.
        message:
            "Every page on your live site will start using this theme. Pages already being " +
            "served may show the previous theme for a short while as caches refresh."
    });

    const activate = (theme: ThemeDto) => {
        confirmActivate(async () => {
            try {
                await themes.activate(theme.id);
                toast.showSuccessToast({
                    title: `“${theme.properties.name}” is now the active theme.`
                });
            } catch (e) {
                toast.showWarningToast({
                    title: e instanceof Error ? e.message : "The theme could not be activated."
                });
            }
        });
    };

    const remove = (theme: ThemeDto) => {
        confirmDelete(async () => {
            try {
                await themes.remove(theme.id);
                toast.showSuccessToast({ title: `“${theme.properties.name}” was deleted.` });
            } catch (e) {
                toast.showWarningToast({
                    title: e instanceof Error ? e.message : "The theme could not be deleted."
                });
            }
        });
    };

    const columns: DataTableColumns<ThemeDto> = {
        properties: {
            header: "Theme",
            cell: (theme: ThemeDto) => (
                <div className="flex flex-col">
                    <Text
                        size="md"
                        className={theme.entryId === activeEntryId ? "font-semibold" : undefined}
                    >
                        {theme.properties.name}
                    </Text>
                    <Text size="sm" className="text-neutral-strong">
                        {theme.entryId === activeEntryId
                            ? `v${theme.version} · live`
                            : `v${theme.version}`}
                    </Text>
                </div>
            )
        },
        tokens: {
            header: "Palette",
            cell: (theme: ThemeDto) => <PaletteStrip theme={theme} />
        },
        status: {
            header: "Status",
            cell: (theme: ThemeDto) => (
                <ThemeStatusTag status={theme.status} isActive={theme.entryId === activeEntryId} />
            )
        },
        savedOn: {
            header: "Last updated",
            cell: (theme: ThemeDto) => (
                <div className="flex flex-col">
                    <TimeAgo datetime={theme.savedOn} />
                    <Text size="sm" className="text-neutral-strong">
                        {theme.savedBy?.displayName ?? ""}
                    </Text>
                </div>
            )
        },
        id: {
            header: "",
            cell: (theme: ThemeDto) => (
                <DropdownMenu
                    trigger={
                        <IconButton
                            variant="ghost"
                            icon={<MoreVerticalIcon />}
                            aria-label="Theme actions"
                        />
                    }
                >
                    <DropdownMenu.Item
                        icon={<EditIcon />}
                        text="Edit"
                        onClick={() => goToRoute(Routes.Editor, { id: theme.id })}
                    />
                    <HasPermission entity="theme" action="publish">
                        <DropdownMenu.Item
                            icon={<BoltIcon />}
                            text="Activate"
                            disabled={theme.entryId === activeEntryId || !theme.resolved}
                            onClick={() => activate(theme)}
                        />
                    </HasPermission>
                    <DropdownMenu.Separator />
                    <HasPermission entity="theme" action="delete">
                        <DropdownMenu.Item
                            icon={<DeleteIcon />}
                            text="Delete"
                            variant="destructive"
                            disabled={theme.entryId === activeEntryId}
                            onClick={() => remove(theme)}
                        />
                    </HasPermission>
                </DropdownMenu>
            )
        }
    };

    return (
        <div className="flex flex-col h-main-content">
            <div className="flex items-center justify-between py-sm px-md">
                <div className="flex flex-col">
                    <Heading level={5}>Themes</Heading>
                    <Text size="sm" className="text-neutral-strong">
                        Design tokens for this site. One theme is active at a time.
                    </Text>
                </div>
                <HasPermission entity="theme" action="create">
                    <Button
                        variant="primary"
                        icon={<AddIcon />}
                        onClick={() => setDialogOpen(true)}
                        text="New theme"
                    />
                </HasPermission>
            </div>
            <Separator />

            {rows.length === 0 && !themes.isListLoading() ? (
                <div className="p-xl">
                    <EmptyState
                        type="listing"
                        title="No themes yet"
                        description={<NewThemeCopy />}
                        actions={
                            <HasPermission entity="theme" action="create">
                                <Button
                                    variant="primary"
                                    icon={<AddIcon />}
                                    onClick={() => setDialogOpen(true)}
                                    text="Create a theme"
                                />
                            </HasPermission>
                        }
                    />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={rows}
                    loading={themes.isListLoading()}
                    onSelectRow={(rows: ThemeDto[]) => {
                        const [theme] = rows;
                        if (theme) {
                            goToRoute(Routes.Editor, { id: theme.id });
                        }
                    }}
                />
            )}

            <NewThemeDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
        </div>
    );
});
