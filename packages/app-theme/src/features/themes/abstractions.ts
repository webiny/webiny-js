import { createAbstraction } from "@webiny/feature/admin";
import type {
    FluidStepMeta,
    RampGeneratorConfig,
    ThemeMode,
    ThemePolicy,
    TokenPath,
    TokenValue,
    TypographySubProperty
} from "@webiny/theme-common";
import type {
    ActiveThemePointerDto,
    PublishThemeResultDto,
    ThemeDto,
    ThemeRevisionDto
} from "~/features/themeGateway/index.js";

export type SaveState = "idle" | "saving" | "saved" | "error";

export interface IThemesRepository {
    // ── List ────────────────────────────────────────────────
    getThemes(): ThemeDto[];
    getActivePointer(): ActiveThemePointerDto | null;
    isListLoading(): boolean;
    loadList(): Promise<void>;

    // ── Editor ──────────────────────────────────────────────
    /** The theme currently open in the editor. */
    getCurrent(): ThemeDto | undefined;
    isCurrentLoading(): boolean;
    loadTheme(id: string): Promise<void>;

    getSaveState(): SaveState;
    getSavedOn(): string | null;
    getError(): string | null;
    clearError(): void;

    // ── Mutations ───────────────────────────────────────────
    create(name: string, description?: string): Promise<ThemeDto>;
    remove(id: string): Promise<void>;
    /**
     * Patches one token in the open theme and schedules a save. The local value updates
     * immediately so the swatch does not lag the picker.
     */
    setTokenValue(path: TokenPath, mode: ThemeMode, value: TokenValue | undefined): void;
    setTokenReference(path: TokenPath, mode: ThemeMode, target: TokenPath): void;
    /**
     * Appends a new brand-color primitive to the palette and schedules a save. A given name becomes
     * the primitive's label and, slugified, its token key (`color.brand.<slug>`) — which drives the
     * emitted CSS variable. Without a name a generated `custom-N` key is used. Keys are always made
     * unique, so an existing primitive is never overwritten. The color is set at creation so the new
     * swatch sorts into its final place already colored, rather than as a grey placeholder to hunt for.
     */
    addBrandColor(name?: string, value?: string): void;
    /**
     * Removes a brand-color primitive. Every slot linked to it is first frozen to the color it
     * currently resolves to — in each mode independently — so the page does not change; the links
     * simply become literal values. See "freeze & remove".
     */
    removeBrandColor(path: TokenPath): void;
    /**
     * Edits one of the theme's fonts. The family is mirrored into the `font.<key>` token — the value
     * the artifacts resolve — and into the settings entry; the weights (which Google Fonts loads) live
     * in settings alone. Google Fonts only in v1.
     */
    setFont(key: string, patch: { family?: string; weights?: number[] }): void;
    /** Turns scaling on or off for a ramp step, or changes either end of its range. */
    setFluid(path: TokenPath, fluid: FluidStepMeta): void;
    /** Changes one sub-property of a composite typography role. */
    setTypography(path: TokenPath, subProperty: TypographySubProperty, value: TokenValue): void;
    /**
     * Regenerates a whole ramp from a base size and ratio, and stores the generator config so the
     * editor can show what produced it. Per-step overrides are discarded — regenerating is the
     * explicit "start this ramp over" action.
     */
    regenerateRamp(rampId: "space" | "text", config: RampGeneratorConfig): void;
    setPolicy(policy: ThemePolicy): void;
    rename(name: string): void;
    /** Forces any pending debounced save to run now. */
    flush(): Promise<void>;

    branch(id: string): Promise<ThemeDto>;
    publish(id: string, comment?: string): Promise<PublishThemeResultDto>;
    activate(id: string): Promise<void>;
    deactivate(): Promise<void>;
    getRevisions(entryId: string): Promise<ThemeRevisionDto[]>;
}

export const ThemesRepository = createAbstraction<IThemesRepository>("Theme/ThemesRepository");

export namespace ThemesRepository {
    export type Interface = IThemesRepository;
}
