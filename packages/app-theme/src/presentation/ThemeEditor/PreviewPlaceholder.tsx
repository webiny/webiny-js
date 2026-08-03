import React, { useState } from "react";
import { SegmentedControl, Text } from "@webiny/admin-ui";
import type { ThemeMode } from "@webiny/theme-common";

interface PreviewPlaceholderProps {
    mode: ThemeMode;
    onModeChange: (mode: ThemeMode) => void;
}

/**
 * The preview region, built as designed but not wired — see the design brief, section 2.
 *
 * The controls are real and the layout is final so the editor does not need redesigning when
 * preview lands; only the canvas is a placeholder. The light/dark switch is the exception: it is
 * live, because it also drives which mode the token rows edit.
 */
export const PreviewPlaceholder = ({ mode, onModeChange }: PreviewPlaceholderProps) => {
    const [surface, setSurface] = useState("components");
    const [viewport, setViewport] = useState("desktop");

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-neutral-dimmed">
            <div className="h-12 flex-none flex items-center gap-sm px-md bg-neutral-base border-b border-neutral-dimmed">
                <SegmentedControl
                    value={surface}
                    onChange={setSurface}
                    disabled={true}
                    items={[
                        { label: "Components", value: "components" },
                        { label: "Website", value: "website" }
                    ]}
                />
                <SegmentedControl
                    value={mode}
                    onChange={(value: string) => onModeChange(value as ThemeMode)}
                    items={[
                        { label: "Light", value: "light" },
                        { label: "Dark", value: "dark" }
                    ]}
                />
                <div className="ml-auto flex items-center gap-sm">
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
                </div>
            </div>

            <div className="flex-1 grid place-items-center p-xl">
                <div className="max-w-[420px] text-center flex flex-col gap-xs">
                    <Text size="lg" className="block font-semibold">
                        Preview is coming
                    </Text>
                    <Text size="md" className="block text-neutral-strong">
                        This is where your components and pages will render with the theme applied.
                        Until then, the swatches and specimens in the editing column show real
                        values.
                    </Text>
                </div>
            </div>
        </div>
    );
};
