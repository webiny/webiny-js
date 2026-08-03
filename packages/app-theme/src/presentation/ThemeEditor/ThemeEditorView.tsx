import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Button, Loader, Separator, Text, useToast } from "@webiny/admin-ui";
import { useRoute, useRouter } from "@webiny/app-admin";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/index.js";
import type { ThemeMode } from "@webiny/theme-common";
import { EDITOR_GROUPS, type EditorGroupId } from "~/constants.js";
import { HasPermission } from "~/presentation/security/HasPermission.js";
import { useThemes } from "~/presentation/useThemes.js";
import { useResolvedTheme } from "~/presentation/useResolvedTheme.js";
import { EditorRail } from "./EditorRail.js";
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
            <div className="h-main-content grid place-items-center">
                <Loader />
            </div>
        );
    }

    const isActive = themes.getActivePointer()?.entryId === theme.entryId;
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
        <div className="flex flex-col h-main-content">
            <div className="flex items-center gap-sm py-sm px-md">
                <Text size="lg" className="font-semibold">
                    {theme.properties.name}
                </Text>
                <Text size="sm" className="text-neutral-strong">
                    {SAVE_LABELS[themes.getSaveState()] ?? ""}
                </Text>

                <div className="ml-auto flex items-center gap-sm">
                    <Button
                        variant="tertiary"
                        onClick={() => setVersionsOpen(true)}
                        text="Versions"
                    />
                    {readOnly ? (
                        <HasPermission entity="theme" action="edit">
                            <Button variant="secondary" onClick={branch} text="Edit as new draft" />
                        </HasPermission>
                    ) : (
                        <HasPermission entity="theme" action="publish">
                            <Button
                                variant="primary"
                                onClick={() => setPublishOpen(true)}
                                text="Publish"
                            />
                        </HasPermission>
                    )}
                    {theme.resolved && !isActive ? (
                        <HasPermission entity="theme" action="publish">
                            <Button variant="secondary" onClick={activate} text="Activate" />
                        </HasPermission>
                    ) : null}
                </div>
            </div>
            <Separator />

            {/* Only renders for generated themes; reads the metadata the extraction task wrote. */}
            <div className="px-md">
                <ExtractionReviewBanner metadata={theme.metadata} />
            </div>

            <div className="flex-1 flex min-h-0">
                <EditorRail
                    theme={theme}
                    isActive={isActive}
                    group={group}
                    onGroupChange={next => setRouteParams(params => ({ ...params, group: next }))}
                />

                <div className="w-[400px] flex-none border-r border-neutral-dimmed flex flex-col bg-neutral-base min-h-0">
                    <div className="px-md py-sm border-b border-neutral-dimmed flex items-center">
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

                <PreviewPlaceholder mode={mode} onModeChange={setMode} />
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
