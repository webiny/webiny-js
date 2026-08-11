import React, { useEffect, useMemo, useState } from "react";
import { IconButton, SegmentedControl, Text, Tooltip, useToast } from "@webiny/admin-ui";
import { ReactComponent as CopyIcon } from "@webiny/icons/content_copy.svg";
import {
    createResolvedSnapshot,
    generateCssArtifact,
    generateJsonArtifact,
    hasDarkMode,
    type ThemeMode
} from "@webiny/theme-common";
import type { ThemeDto } from "~/features/themeGateway/index.js";
import { TypographyPreview } from "./TypographyPreview.js";

interface PreviewPlaceholderProps {
    theme: ThemeDto;
    /** The open editor group; its preview (where one exists) renders on the rendered surfaces. */
    group: string;
    mode: ThemeMode;
    onModeChange: (mode: ThemeMode) => void;
}

/** What the preview column is showing: a rendered surface (not built yet) or a raw artifact. */
type Surface = "components" | "website" | "css" | "json";

/**
 * The preview region, built as designed but not wired — see the design brief, section 2.
 *
 * The rendered surfaces (Components / Website) are still placeholders, but CSS and JSON are real:
 * they generate the theme's artifacts client-side from the current draft — the same pure functions
 * the API runs at publish — so what you read here is byte-for-byte what will be served. The
 * light/dark switch stays live because it also drives which mode the token rows edit.
 */
export const PreviewPlaceholder = ({
    theme,
    group,
    mode,
    onModeChange
}: PreviewPlaceholderProps) => {
    const toast = useToast();
    const [surface, setSurface] = useState<Surface>("components");
    const [viewport, setViewport] = useState("desktop");

    // A single (light-only) theme has no dark values to preview — hide the mode switch and never sit
    // on a dark preview the theme won't ship.
    const dualScheme = hasDarkMode(theme.policy);
    useEffect(() => {
        if (!dualScheme && mode !== "light") {
            onModeChange("light");
        }
    }, [dualScheme, mode, onModeChange]);

    // Generated only when a code surface is selected. A mid-edit draft can be momentarily invalid,
    // in which case generation throws and we show a note rather than a stale or partial artifact.
    const artifact = useMemo(() => {
        if (surface !== "css" && surface !== "json") {
            return null;
        }
        try {
            const snapshot =
                theme.resolved ??
                createResolvedSnapshot({
                    document: theme.tokens,
                    policy: theme.policy,
                    settings: theme.settings
                });
            const options = { themeId: theme.entryId, version: theme.version };
            return surface === "css"
                ? generateCssArtifact(snapshot, options)
                : JSON.stringify(generateJsonArtifact(snapshot, options), null, 2);
        } catch {
            return null;
        }
    }, [
        surface,
        theme.tokens,
        theme.policy,
        theme.settings,
        theme.resolved,
        theme.entryId,
        theme.version
    ]);

    const showCode = surface === "css" || surface === "json";

    const copy = async () => {
        if (artifact === null) {
            return;
        }
        try {
            await navigator.clipboard.writeText(artifact);
            toast.showSuccessToast({ title: `${surface.toUpperCase()} copied to the clipboard.` });
        } catch {
            toast.showWarningToast({ title: "Could not copy to the clipboard." });
        }
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-neutral-dimmed">
            <div className="h-12 flex-none flex items-center gap-sm px-md bg-neutral-base border-b border-neutral-dimmed">
                <SegmentedControl
                    value={surface}
                    onChange={(value: string) => setSurface(value as Surface)}
                    items={[
                        { label: "Components", value: "components" },
                        { label: "Website", value: "website" },
                        { label: "CSS", value: "css" },
                        { label: "JSON", value: "json" }
                    ]}
                />
                {dualScheme ? (
                    <SegmentedControl
                        value={mode}
                        onChange={(value: string) => onModeChange(value as ThemeMode)}
                        items={[
                            { label: "Light", value: "light" },
                            { label: "Dark", value: "dark" }
                        ]}
                    />
                ) : null}
                <div className="ml-auto flex items-center gap-sm">
                    {showCode ? (
                        <Tooltip
                            content="Copy"
                            rawTrigger={true}
                            trigger={
                                <IconButton
                                    variant="ghost"
                                    icon={<CopyIcon />}
                                    aria-label="Copy"
                                    disabled={artifact === null}
                                    onClick={copy}
                                />
                            }
                        />
                    ) : (
                        <SegmentedControl
                            value={viewport}
                            onChange={setViewport}
                            disabled={true}
                            items={[
                                { label: "Desktop", value: "desktop" },
                                { label: "Tablet", value: "tablet" },
                                { label: "Phone", value: "phone" }
                            ]}
                        />
                    )}
                </div>
            </div>

            {showCode ? (
                artifact !== null ? (
                    <div className="flex-1 min-h-0 overflow-auto bg-neutral-base">
                        <pre className="p-md text-sm font-mono leading-relaxed text-neutral-strong">
                            {artifact}
                        </pre>
                    </div>
                ) : (
                    <div className="flex-1 grid place-items-center p-xl">
                        <Text
                            size="md"
                            className="block text-center text-neutral-strong max-w-[360px]"
                        >
                            This draft can&apos;t be generated yet — resolve the outstanding
                            validation issues and the {surface.toUpperCase()} will appear here.
                        </Text>
                    </div>
                )
            ) : group === "typography" ? (
                <TypographyPreview theme={theme} />
            ) : (
                <div className="flex-1 grid place-items-center p-xl">
                    <div className="max-w-[420px] text-center flex flex-col gap-xs">
                        <Text size="lg" className="block font-semibold">
                            Preview is coming
                        </Text>
                        <Text size="md" className="block text-neutral-strong">
                            This is where your components and pages will render with the theme
                            applied. Until then, use the CSS and JSON tabs to see the generated
                            output, or the swatches and specimens in the editing column.
                        </Text>
                    </div>
                </div>
            )}
        </div>
    );
};
