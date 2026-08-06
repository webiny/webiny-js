import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import {
    Button,
    cn,
    Drawer,
    IconButton,
    Loader,
    Separator,
    Tag,
    Text,
    TimeAgo,
    useToast
} from "@webiny/admin-ui";
import { useRouter } from "@webiny/app-admin";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/index.js";
import { ReactComponent as CheckCircleIcon } from "@webiny/icons/check_circle.svg";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
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
            <div className="flex items-start justify-between gap-sm p-md">
                <div className="flex flex-col gap-xs min-w-0">
                    <Text size="lg" className="block font-semibold">
                        Version history
                    </Text>
                    <Text size="sm" className="block truncate text-neutral-strong">
                        {theme.properties.name}
                    </Text>
                </div>
                <IconButton
                    variant="ghost"
                    size="lg"
                    icon={<CloseIcon />}
                    aria-label="Close version history"
                    onClick={onClose}
                />
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
                        // A frozen (locked) revision is a published version: it has a snapshot to
                        // serve, so it can be activated. `locked` is per-revision, unlike the
                        // entry-level `lastPublishedOn`, which stays set even on a fresh draft.
                        const published = revision.locked;

                        // Only published revisions carry a meaningful note; a draft's field is empty
                        // (or a stale value carried from the revision it branched off).
                        const note = published ? revision.publishComment?.trim() : "";

                        const author = revision.createdBy?.displayName ?? "";

                        return (
                            <div
                                key={revision.id}
                                // A transparent left border on every row keeps text aligned; the open
                                // row fills it with the accent (and a faint tint) as a "you are here"
                                // marker — so no separate, crowding "Open" tag is needed.
                                className={cn(
                                    "flex flex-col gap-sm border-b border-b-neutral-dimmed border-l-2 border-l-transparent px-md py-md",
                                    isOpen && "border-l-primary bg-neutral-light"
                                )}
                            >
                                {/* Line 1: which version + its status on the left, actions right. */}
                                <div className="flex items-center gap-sm">
                                    <Text size="md" className="flex-none font-mono font-semibold">
                                        {`v${revision.version}`}
                                    </Text>
                                    {/* Exactly one status per version: Active (the live pointer)
                                        wins, otherwise Published if it was ever frozen, else Draft. */}
                                    {isActive ? (
                                        <Tag
                                            variant="accent"
                                            icon={<CheckCircleIcon />}
                                            content="Active"
                                        />
                                    ) : published ? (
                                        <Tag variant="success-light" content="Published" />
                                    ) : (
                                        <Tag variant="neutral-light" content="Draft" />
                                    )}

                                    <div className="ml-auto flex items-center gap-xs">
                                        {isOpen ? (
                                            <Text size="sm" className="italic text-neutral-dimmed">
                                                Currently open
                                            </Text>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    goToRoute(Routes.Editor, { id: revision.id });
                                                    onClose();
                                                }}
                                                text="Open"
                                            />
                                        )}
                                        {published && !isActive ? (
                                            <HasPermission entity="theme" action="publish">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => activate(revision)}
                                                    text="Activate"
                                                />
                                            </HasPermission>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Line 2: who and when, one muted line. */}
                                <div className="flex items-center gap-xs text-sm text-neutral-dimmed">
                                    {author ? (
                                        <>
                                            <span className="truncate">{author}</span>
                                            <span aria-hidden="true">·</span>
                                        </>
                                    ) : null}
                                    {/* Per-revision save time (≈ publish time on a frozen version);
                                        the entry-level lastPublishedOn is the same across revisions. */}
                                    <TimeAgo datetime={revision.savedOn} />
                                </div>

                                {/* The publish note, set apart as a quote. */}
                                {note ? (
                                    <div className="border-l-2 border-neutral-dimmed-darker pl-sm">
                                        <Text
                                            size="sm"
                                            className="block whitespace-pre-wrap text-neutral-strong"
                                        >
                                            {note}
                                        </Text>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            )}
        </Drawer>
    );
});
