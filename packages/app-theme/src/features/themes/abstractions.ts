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
    publish(id: string): Promise<PublishThemeResultDto>;
    activate(id: string): Promise<void>;
    deactivate(): Promise<void>;
    getRevisions(entryId: string): Promise<ThemeRevisionDto[]>;
}

export const ThemesRepository = createAbstraction<IThemesRepository>("Theme/ThemesRepository");

export namespace ThemesRepository {
    export type Interface = IThemesRepository;
}
