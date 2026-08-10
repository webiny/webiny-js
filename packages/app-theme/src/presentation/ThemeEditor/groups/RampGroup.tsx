import React from "react";
import { observer } from "mobx-react-lite";
import type { RampId, ThemeMode } from "@webiny/theme-common";
import type { ResolvedThemeView } from "~/presentation/useResolvedTheme.js";
import type { ThemeDto } from "~/features/themeGateway/index.js";
import { RadiusEditor } from "./RadiusEditor.js";
import { RampEditor } from "./RampEditor.js";
import { ShadowEditor } from "./ShadowEditor.js";
import { BorderEditor } from "./BorderEditor.js";

/**
 * Router for the three non-typography scale screens. Each is a fixed, named set of steps — the set is
 * deliberate, so a token like `space.md` means the same thing everywhere and drives the CSS artifact
 * and the Tailwind preset — but the values are editable.
 *
 * Spacing is a generated scale (base + ratio, fluid steps) → {@link RampEditor}. Radius is a hand-set
 * list of lengths → {@link RadiusEditor}. Shadow is a list of elevation layers → {@link ShadowEditor}.
 * All three share the same scroll container so the screens line up; typography composes its own.
 */
export const RampGroup = observer(function RampGroup(props: {
    rampId: RampId;
    theme: ThemeDto;
    resolved: ResolvedThemeView;
    mode: ThemeMode;
    readOnly: boolean;
}) {
    const { rampId, theme, resolved, mode, readOnly } = props;

    const shared = { theme, resolved, mode, readOnly };

    return (
        <div className="flex-1 min-h-0 overflow-y-auto px-md py-sm flex flex-col gap-md">
            {rampId === "space" ? (
                <RampEditor rampId="space" {...shared} />
            ) : rampId === "radius" ? (
                <RadiusEditor {...shared} />
            ) : rampId === "border" ? (
                <BorderEditor {...shared} />
            ) : (
                <ShadowEditor {...shared} />
            )}
        </div>
    );
});
