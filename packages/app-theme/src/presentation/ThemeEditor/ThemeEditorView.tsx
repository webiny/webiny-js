import React, { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import {
    Breadcrumbs,
    Button,
    createHomeBreadcrumbItem,
    Loader,
    Separator,
    Text,
    useToast
} from "@webiny/admin-ui";
import { useContainer } from "@webiny/app";
import { RouterGateway } from "@webiny/app/features/router/abstractions.js";
import { ReactComponent as HistoryIcon } from "@webiny/icons/history.svg";
import { useRoute, useRouter } from "@webiny/app-admin";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/index.js";
import { validateForPublish, type ThemeMode } from "@webiny/theme-common";
import { EDITOR_GROUPS, type EditorGroupId } from "~/constants.js";
import { HasPermission } from "~/presentation/security/HasPermission.js";
import { useThemes } from "~/presentation/useThemes.js";
import { useResolvedTheme } from "~/presentation/useResolvedTheme.js";
import { EditorRail } from "./EditorRail.js";
import { groupForTokenPath } from "./groupMeta.js";
import { PreviewPlaceholder } from "./PreviewPlaceholder.js";
import { ExtractionReviewBanner } from "./ExtractionReviewBanner.js";
import { PublishDialog } from "./PublishDialog.js";
import { VersionsDrawer } from "./VersionsDrawer.js";
import { ColorsGroup } from "./groups/ColorsGroup.js";
import { PolicyGroup } from "./groups/PolicyGroup.js";
import { RampGroup } from "./groups/RampGroup.js";
import { TypographyGroup } from "./groups/TypographyGroup.js";
import { Routes } from "~/routes.js";

const SAVE_LABELS: Record<string, string> = {
    idle: "",
    saving: "Saving…",
    saved: "Saved",
    error: "Not saved"
};

const GROUP_TITLES = Object.fromEntries(EDITOR_GROUPS.map(group => [group.id, group.label]));

export const ThemeEditorView = observer(function ThemeEditorView() {
    const themes = useThemes();
    const toast = useToast();
    const container = useContainer();
    const { goToRoute } = useRouter();
    const { route, setRouteParams } = useRoute(Routes.Editor);

    const id = route?.params?.id;

    const [mode, setMode] = useState<ThemeMode>("light");
    const [publishOpen, setPublishOpen] = useState(false);
    const [versionsOpen, setVersionsOpen] = useState(false);

    const group = ((route?.params?.group as EditorGroupId) ?? "colors") as EditorGroupId;

    useEffect(() => {
        if (id) {
            void themes.loadTheme(id);
        }
    }, [id, themes]);

    const theme = themes.getCurrent();

    // Resolved before the loading guard: hooks cannot sit after an early return, and the hook
    // handles an absent theme.
    const resolved = useResolvedTheme(theme);

    // Which groups deserve an attention dot in the rail. It mirrors the publish gate exactly: every
    // blocker and warning maps (by token path) to the group that can fix it, so a dot means "there
    // is something to address on this screen" — the same list the Publish dialog shows.
    const attention = useMemo(() => {
        const flagged = new Set<EditorGroupId>();
        if (!theme) {
            return flagged;
        }
        const { blockers, warnings } = validateForPublish(theme.tokens, theme.settings);
        for (const item of [...blockers, ...warnings]) {
            const groupId = groupForTokenPath(item.path);
            if (groupId) {
                flagged.add(groupId);
            }
        }
        return flagged;
    }, [theme]);

    const { showConfirmation: confirmActivate } = useConfirmationDialog({
        title: "Activate this theme",
        message:
            "Every page on your live site will start using this version. Pages already being " +
            "served may show the previous theme for a short while as caches refresh."
    });

    const { showConfirmation: confirmBranch } = useConfirmationDialog({
        title: "Edit a published version",
        message:
            "Published versions are locked. This creates a new draft from it, which you can edit " +
            "and publish when you are ready."
    });

    if (!theme || themes.isCurrentLoading()) {
        return (
            <div className="h-screen grid place-items-center">
                <Loader />
            </div>
        );
    }

    const activePointer = themes.getActivePointer();
    // This exact revision being live is a different question from the theme having *some* live
    // version. The status indicator and the Activate button both need the per-revision answer —
    // otherwise every version reads as "Active" and you cannot activate a different one.
    const isActive = activePointer?.id === theme.id;
    // The live version of this theme, if any — so we can point at it while viewing a different one.
    const activeForTheme =
        activePointer && activePointer.entryId === theme.entryId ? activePointer : null;
    // A published revision is locked by the CMS, so editing it means branching a new draft first.
    const readOnly = theme.locked;

    const activate = () => {
        confirmActivate(async () => {
            try {
                await themes.activate(theme.id);
                toast.showSuccessToast({ title: `v${theme.version} is now live.` });
            } catch (e) {
                toast.showWarningToast({
                    title: e instanceof Error ? e.message : "The theme could not be activated."
                });
            }
        });
    };

    const branch = () => {
        confirmBranch(async () => {
            try {
                const draft = await themes.branch(theme.id);
                goToRoute(Routes.Editor, { id: draft.id });
            } catch (e) {
                toast.showWarningToast({
                    title: e instanceof Error ? e.message : "A new draft could not be created."
                });
            }
        });
    };

    const renderGroup = () => {
        switch (group) {
            case "colors":
                return (
                    <ColorsGroup
                        theme={theme}
                        resolved={resolved}
                        mode={mode}
                        readOnly={readOnly}
                    />
                );
            case "spacing":
                return (
                    <RampGroup
                        rampId="space"
                        theme={theme}
                        resolved={resolved}
                        mode={mode}
                        readOnly={readOnly}
                    />
                );
            case "radius":
                return (
                    <RampGroup
                        rampId="radius"
                        theme={theme}
                        resolved={resolved}
                        mode={mode}
                        readOnly={readOnly}
                    />
                );
            case "shadows":
                return (
                    <RampGroup
                        rampId="shadow"
                        theme={theme}
                        resolved={resolved}
                        mode={mode}
                        readOnly={readOnly}
                    />
                );
            case "typography":
                return (
                    <TypographyGroup
                        theme={theme}
                        resolved={resolved}
                        mode={mode}
                        readOnly={readOnly}
                    />
                );
            case "policy":
                return <PolicyGroup theme={theme} readOnly={readOnly} />;
            default:
                return (
                    <div className="flex-1 grid place-items-center p-lg">
                        <Text
                            size="md"
                            className="block text-center text-neutral-strong max-w-[280px]"
                        >{`The ${GROUP_TITLES[group]?.toLowerCase() ?? group} editor is not built yet.`}</Text>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col h-screen">
            <div className="flex items-center gap-sm py-sm px-md">
                {/* Home icon → dashboard, "Themes" → the list, theme name = current item, matching
                    the standard admin breadcrumb trail. */}
                <Breadcrumbs
                    items={[
                        createHomeBreadcrumbItem(() =>
                            container.resolve(RouterGateway).pushState("/")
                        ),
                        { label: "Themes", onClick: () => goToRoute(Routes.List) },
                        { label: theme.properties.name, current: true }
                    ]}
                />

                <div className="ml-auto flex items-center gap-sm">
                    {/* 1. Saving indicator. */}
                    {SAVE_LABELS[themes.getSaveState()] ? (
                        <Text size="sm" className="text-neutral-muted">
                            {SAVE_LABELS[themes.getSaveState()]}
                        </Text>
                    ) : null}

                    {/* 2. Versions — opens the drawer; the current version + status live in the left
                        rail, as in the Website Builder and CMS editors. */}
                    <Button
                        variant="ghost"
                        onClick={() => setVersionsOpen(true)}
                        iconPosition="start"
                        icon={<HistoryIcon />}
                        text="Versions"
                    />

                    {/* 3. Publish a draft, or branch a locked revision back into an editable draft. */}
                    {readOnly ? (
                        <HasPermission entity="theme" action="edit">
                            <Button variant="secondary" onClick={branch} text="Edit as new draft" />
                        </HasPermission>
                    ) : (
                        <HasPermission entity="theme" action="publish">
                            <Button
                                variant="secondary"
                                onClick={() => setPublishOpen(true)}
                                text="Publish"
                            />
                        </HasPermission>
                    )}

                    {/* 4. Activate — make this version the one served live. */}
                    <HasPermission entity="theme" action="publish">
                        <Button
                            variant="primary"
                            onClick={activate}
                            disabled={!theme.resolved || isActive}
                            text="Activate"
                        />
                    </HasPermission>
                </div>
            </div>
            <Separator />

            {/* Only renders for generated themes; reads the metadata the extraction task wrote. It
                carries its own margins, so a hand-made theme leaves no empty strip here. */}
            <ExtractionReviewBanner metadata={theme.metadata} />

            <div className="flex-1 flex min-h-0">
                <EditorRail
                    theme={theme}
                    isActive={isActive}
                    activeVersion={activeForTheme?.version ?? null}
                    onOpenActiveVersion={
                        activeForTheme
                            ? () => goToRoute(Routes.Editor, { id: activeForTheme.id })
                            : undefined
                    }
                    group={group}
                    warnings={attention}
                    readOnly={readOnly}
                    onRename={name => themes.rename(name)}
                    onGroupChange={next => setRouteParams(params => ({ ...params, group: next }))}
                />

                <div className="w-[400px] flex-none border-r border-neutral-dimmed flex flex-col bg-neutral-base min-h-0">
                    {/* h-12 matches the preview header so the two bottom borders align across panels. */}
                    <div className="h-12 flex-none px-md border-b border-neutral-dimmed flex items-center">
                        <Text size="md" className="font-semibold">
                            {GROUP_TITLES[group] ?? group}
                        </Text>
                        {readOnly ? (
                            <Text size="sm" className="ml-auto text-neutral-strong">
                                Read only
                            </Text>
                        ) : null}
                    </div>
                    {renderGroup()}
                </div>

                <PreviewPlaceholder
                    theme={theme}
                    group={group}
                    mode={mode}
                    onModeChange={setMode}
                />
            </div>

            <PublishDialog theme={theme} open={publishOpen} onClose={() => setPublishOpen(false)} />
            <VersionsDrawer
                theme={theme}
                open={versionsOpen}
                onClose={() => setVersionsOpen(false)}
            />
        </div>
    );
});
