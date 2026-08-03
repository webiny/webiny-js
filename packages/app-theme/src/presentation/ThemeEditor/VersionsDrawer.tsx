import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Button, Drawer, Loader, Separator, Tag, Text, TimeAgo, useToast } from "@webiny/admin-ui";
import { useRouter } from "@webiny/app-admin";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/index.js";
import { ReactComponent as CheckCircleIcon } from "@webiny/icons/check_circle.svg";
import { HasPermission } from "~/presentation/security/HasPermission.js";
import { useThemes } from "~/presentation/useThemes.js";
import { Routes } from "~/routes.js";
import type { ThemeDto, ThemeRevisionDto } from "~/features/themeGateway/index.js";

interface VersionsDrawerProps {
    theme: ThemeDto;
    open: boolean;
    onClose: () => void;
}

/**
 * Version history — see the design brief, screen 11.
 *
 * Rollback is not a separate operation: it is activating an older version, so the same Activate
 * action appears on every row that has been published. Preview is out of scope for v1, so a row
 * offers "Open" instead — which loads that revision into the editor read-only.
 */
export const VersionsDrawer = observer(function VersionsDrawer({
    theme,
    open,
    onClose
}: VersionsDrawerProps) {
    const themes = useThemes();
    const toast = useToast();
    const { goToRoute } = useRouter();

    const [revisions, setRevisions] = useState<ThemeRevisionDto[]>([]);
    const [loading, setLoading] = useState(false);

    const activePointer = themes.getActivePointer();

    useEffect(() => {
        if (!open) {
            return;
        }

        setLoading(true);
        themes
            .getRevisions(theme.entryId)
            .then(setRevisions)
            .catch(e =>
                toast.showWarningToast({
                    title: e instanceof Error ? e.message : "Version history could not be loaded."
                })
            )
            .finally(() => setLoading(false));
    }, [open, theme.entryId, theme.version, themes, toast]);

    const { showConfirmation: confirmActivate } = useConfirmationDialog({
        title: "Activate this version",
        message:
            "Every page on your live site will start using this version. Pages already being " +
            "served may show the previous theme for a short while as caches refresh."
    });

    const activate = (revision: ThemeRevisionDto) => {
        confirmActivate(async () => {
            try {
                await themes.activate(revision.id);
                toast.showSuccessToast({ title: `v${revision.version} is now live.` });
                onClose();
            } catch (e) {
                toast.showWarningToast({
                    title: e instanceof Error ? e.message : "The version could not be activated."
                });
            }
        });
    };

    return (
        <Drawer open={open} onOpenChange={value => (value ? undefined : onClose())} side="right">
            <div className="flex flex-col gap-xs p-md">
                <Text size="lg" className="block font-semibold">
                    Version history
                </Text>
                <Text size="sm" className="block text-neutral-strong">
                    {theme.properties.name}
                </Text>
            </div>
            <Separator />

            {loading ? (
                <div className="grid place-items-center p-xl">
                    <Loader />
                </div>
            ) : (
                <div className="flex flex-col overflow-y-auto">
                    {revisions.map(revision => {
                        const isActive = activePointer?.id === revision.id;
                        const isOpen = theme.id === revision.id;
                        // Only a version that has been published can be activated. A never-published
                        // draft has no frozen snapshot to serve.
                        const publishable = revision.lastPublishedOn !== null;

                        return (
                            <div
                                key={revision.id}
                                className="flex items-center gap-sm px-md py-sm border-b border-neutral-dimmed"
                            >
                                <div className="flex flex-col flex-1 min-w-0">
                                    <div className="flex items-center gap-xs">
                                        <Text size="md" className="font-mono">
                                            {`v${revision.version}`}
                                        </Text>
                                        {isActive ? (
                                            <Tag
                                                variant="accent"
                                                icon={<CheckCircleIcon />}
                                                content="Active"
                                            />
                                        ) : null}
                                        {isOpen && !isActive ? (
                                            <Tag variant="neutral-light" content="Open" />
                                        ) : null}
                                    </div>
                                    <Text size="sm" className="text-neutral-strong">
                                        {revision.createdBy?.displayName ?? ""}
                                    </Text>
                                </div>

                                <TimeAgo datetime={revision.lastPublishedOn ?? revision.savedOn} />

                                <div className="flex items-center gap-xs">
                                    {isOpen ? null : (
                                        <Button
                                            variant="tertiary"
                                            onClick={() => {
                                                goToRoute(Routes.Editor, { id: revision.id });
                                                onClose();
                                            }}
                                            text="Open"
                                        />
                                    )}
                                    {publishable && !isActive ? (
                                        <HasPermission entity="theme" action="publish">
                                            <Button
                                                variant="secondary"
                                                onClick={() => activate(revision)}
                                                text="Activate"
                                            />
                                        </HasPermission>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Drawer>
    );
});
