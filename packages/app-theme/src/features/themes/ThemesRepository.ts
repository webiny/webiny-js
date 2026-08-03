import { makeAutoObservable, runInAction } from "mobx";
import {
    applyRamp,
    generateRamp,
    getRamp,
    setTokenFluid,
    setTokenReference,
    setTokenValue,
    setTypographySubProperty,
    type FluidStepMeta,
    type RampGeneratorConfig,
    type ThemeMode,
    type ThemePolicy,
    type TokenPath,
    type TokenValue,
    type TypographySubProperty
} from "@webiny/theme-common";
import { ThemesRepository as RepositoryAbstraction, type SaveState } from "./abstractions.js";
import {
    ThemeGateway,
    type ActiveThemePointerDto,
    type ThemeDto,
    type UpdateThemeInputDto
} from "~/features/themeGateway/index.js";

/**
 * Debounce window for token edits. Long enough that dragging a colour picker produces one save
 * rather than fifty; short enough that "Saved" appears while the user is still looking at the row.
 */
const SAVE_DEBOUNCE_MS = 600;

class ThemesRepositoryImpl implements RepositoryAbstraction.Interface {
    private themes: ThemeDto[] = [];
    private activePointer: ActiveThemePointerDto | null = null;
    private listLoading = false;

    private current: ThemeDto | undefined = undefined;
    private currentLoading = false;

    private saveState: SaveState = "idle";
    private error: string | null = null;

    /** Accumulated unsaved sections, flushed together. */
    private pending: UpdateThemeInputDto = {};
    private timer: ReturnType<typeof setTimeout> | null = null;
    private inFlight: Promise<void> | null = null;

    constructor(private gateway: ThemeGateway.Interface) {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    getThemes() {
        return this.themes;
    }

    getActivePointer() {
        return this.activePointer;
    }

    isListLoading() {
        return this.listLoading;
    }

    async loadList() {
        runInAction(() => {
            this.listLoading = true;
            this.error = null;
        });

        try {
            // The pointer is needed to mark the active row, and it is a separate read.
            const [themes, active] = await Promise.all([
                this.gateway.list(),
                this.gateway.getActive()
            ]);

            runInAction(() => {
                this.themes = themes;
                this.activePointer = active?.pointer ?? null;
            });
        } catch (e) {
            this.fail(e);
        } finally {
            runInAction(() => {
                this.listLoading = false;
            });
        }
    }

    getCurrent() {
        return this.current;
    }

    isCurrentLoading() {
        return this.currentLoading;
    }

    async loadTheme(id: string) {
        if (this.current?.id === id) {
            return;
        }

        runInAction(() => {
            this.currentLoading = true;
            this.error = null;
        });

        try {
            const [theme, active] = await Promise.all([
                this.gateway.get(id),
                this.gateway.getActive()
            ]);

            runInAction(() => {
                this.current = theme;
                this.activePointer = active?.pointer ?? null;
                this.saveState = "idle";
            });
        } catch (e) {
            this.fail(e);
        } finally {
            runInAction(() => {
                this.currentLoading = false;
            });
        }
    }

    getSaveState() {
        return this.saveState;
    }

    getSavedOn() {
        return this.current?.savedOn ?? null;
    }

    getError() {
        return this.error;
    }

    clearError() {
        this.error = null;
    }

    async create(name: string, description?: string) {
        const theme = await this.gateway.create({ properties: { name, description } });

        runInAction(() => {
            this.themes = [theme, ...this.themes];
        });

        return theme;
    }

    async remove(id: string) {
        await this.gateway.remove(id);

        runInAction(() => {
            this.themes = this.themes.filter(theme => theme.id !== id);
        });
    }

    setTokenValue(path: TokenPath, mode: ThemeMode, value: TokenValue | undefined) {
        this.patchTokens(tokens => setTokenValue(tokens, path, mode, value));
    }

    setTokenReference(path: TokenPath, mode: ThemeMode, target: TokenPath) {
        this.patchTokens(tokens => setTokenReference(tokens, path, mode, target));
    }

    setFluid(path: TokenPath, fluid: FluidStepMeta) {
        this.patchTokens(tokens => setTokenFluid(tokens, path, fluid));
    }

    setTypography(path: TokenPath, subProperty: TypographySubProperty, value: TokenValue) {
        this.patchTokens(tokens => setTypographySubProperty(tokens, path, subProperty, value));
    }

    regenerateRamp(rampId: "space" | "text", config: RampGeneratorConfig) {
        if (!this.current) {
            return;
        }

        const steps = generateRamp(rampId, config);
        const tokens = applyRamp(this.current.tokens, getRamp(rampId).pathPrefix, steps);

        // The generator config is editor metadata, not a token, so it rides along in settings.
        const settings = {
            ...this.current.settings,
            ramps: { ...this.current.settings.ramps, [rampId]: config }
        };

        runInAction(() => {
            this.current = { ...this.current!, tokens, settings };
            this.pending.tokens = tokens;
            this.pending.settings = settings;
        });

        this.schedule();
    }

    setPolicy(policy: ThemePolicy) {
        if (!this.current) {
            return;
        }

        runInAction(() => {
            this.current = { ...this.current!, policy };
            this.pending.policy = policy;
        });

        this.schedule();
    }

    rename(name: string) {
        if (!this.current) {
            return;
        }

        const properties = { ...this.current.properties, name };

        runInAction(() => {
            this.current = { ...this.current!, properties };
            this.pending.properties = properties;
        });

        this.schedule();
    }

    async flush() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        await this.save();
    }

    async branch(id: string) {
        const theme = await this.gateway.createRevisionFrom(id);

        runInAction(() => {
            this.current = theme;
            this.saveState = "idle";
        });

        return theme;
    }

    async publish(id: string) {
        // A pending edit must reach the server before the version is frozen, or it silently would
        // not be part of what got published.
        await this.flush();

        const result = await this.gateway.publish(id);

        runInAction(() => {
            this.current = result.theme;
        });

        return result;
    }

    async activate(id: string) {
        const result = await this.gateway.activate(id);

        runInAction(() => {
            this.activePointer = result.pointer;
            if (this.current?.id === result.theme.id) {
                this.current = result.theme;
            }
        });
    }

    async deactivate() {
        await this.gateway.deactivate();

        runInAction(() => {
            this.activePointer = null;
        });
    }

    async getRevisions(entryId: string) {
        return this.gateway.getRevisions(entryId);
    }

    private patchTokens(patch: (tokens: ThemeDto["tokens"]) => ThemeDto["tokens"]) {
        if (!this.current) {
            return;
        }

        const tokens = patch(this.current.tokens);

        runInAction(() => {
            this.current = { ...this.current!, tokens };
            this.pending.tokens = tokens;
        });

        this.schedule();
    }

    private schedule() {
        if (this.timer) {
            clearTimeout(this.timer);
        }

        runInAction(() => {
            this.saveState = "saving";
        });

        this.timer = setTimeout(() => {
            this.timer = null;
            void this.save();
        }, SAVE_DEBOUNCE_MS);
    }

    private async save() {
        // Coalesce: a save already running absorbs whatever landed while it was in flight on the
        // next call, rather than racing it.
        if (this.inFlight) {
            await this.inFlight;
        }

        const theme = this.current;
        const payload = this.pending;

        if (!theme || Object.keys(payload).length === 0) {
            return;
        }

        this.pending = {};

        this.inFlight = (async () => {
            try {
                const saved = await this.gateway.update(theme.id, payload);

                runInAction(() => {
                    // Keep the local token tree: it may already be ahead of what we just sent.
                    this.current = { ...saved, tokens: this.current?.tokens ?? saved.tokens };
                    this.saveState = "saved";
                });
            } catch (e) {
                this.fail(e);
            } finally {
                this.inFlight = null;
            }
        })();

        await this.inFlight;
    }

    private fail(e: unknown) {
        runInAction(() => {
            this.error = e instanceof Error ? e.message : String(e);
            this.saveState = "error";
        });
    }
}

export const ThemesRepository = RepositoryAbstraction.createImplementation({
    implementation: ThemesRepositoryImpl,
    dependencies: [ThemeGateway]
});
