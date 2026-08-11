import { computed, makeAutoObservable, reaction, runInAction } from "mobx";
import {
    FormModelFactory,
    type IFormModel
} from "@webiny/app-admin/features/formModel/abstractions.js";
import {
    ComponentEditorPresenter as PresenterAbstraction,
    SandboxPreviewEvents
} from "./abstractions.js";
import type { ISandboxVm } from "./abstractions.js";
import { RemoteComponentGateway, type ThemeSummary } from "~/admin/features/shared/abstractions.js";
import {
    generateCssArtifact,
    createResolvedSnapshot,
    type ResolvedThemeSnapshot,
    type TokenDocument,
    type ThemePolicy,
    type ThemeSettings
} from "@webiny/theme-common";
import { bundleComponentInBrowser } from "~/admin/bundler/browserBundler.js";
import type { RemoteComponentDto } from "~/shared/types.js";
import { ComponentSourceEditor } from "./ComponentSourceEditor.js";
import {
    createTextInput,
    createLongTextInput,
    createNumberInput,
    createBooleanInput,
    createColorInput,
    createFileInput,
    createDateInput,
    createLexicalInput,
    createSelectInput,
    createRadioInput,
    createObjectInput,
    createTagsInput,
    createSlotInput,
    createInput
} from "@webiny/website-builder-sdk";

interface ExtractedManifest {
    name: string;
    inputs: any[];
    defaults?: { inputs?: Record<string, any>; styles?: Record<string, any> };
    applyDefaultStyles?: boolean;
}

function extractManifest(bundledJs: string): ExtractedManifest | null {
    try {
        const fn = new Function(
            `var __remoteComponent__; ${bundledJs}; return __remoteComponent__;`
        );
        const mod = fn();

        const stub = {
            version: "1",
            dependencies: {
                sdk: {
                    createComponent: (component: any, manifest: any) => ({ component, manifest }),
                    createTextInput,
                    createLongTextInput,
                    createNumberInput,
                    createBooleanInput,
                    createColorInput,
                    createFileInput,
                    createDateInput,
                    createLexicalInput,
                    createSelectInput,
                    createRadioInput,
                    createObjectInput,
                    createTagsInput,
                    createSlotInput,
                    createInput
                },
                React: { createElement: () => null, Fragment: null }
            },
            environment: { tenantId: "root", locale: "en-US", mode: "browser" }
        };
        const result = mod.createComponent(stub);
        if (!result?.manifest) {
            return null;
        }
        return {
            name: result.manifest.name,
            inputs: result.manifest.inputs ?? [],
            defaults: result.manifest.defaults ?? undefined,
            applyDefaultStyles: result.manifest.applyDefaultStyles
        };
    } catch {
        return null;
    }
}

const sourceEditor = new ComponentSourceEditor();

class ComponentEditorPresenterImpl implements PresenterAbstraction.Interface {
    private _loading = false;
    private _saving = false;
    private _bundling = false;
    private _refining = false;
    private _component: RemoteComponentDto | null = null;
    private _source = "";
    private _css = "";
    private _error: string | null = null;
    private _form: IFormModel;
    private _refineForm: IFormModel;
    private _lastBundledSource = "";
    private _lastBundledCss = "";
    private _reactionDisposers: Array<() => void> = [];
    private _themeOptions: ThemeSummary[] = [];
    private _selectedThemeId: string | null = null;
    private _selectedThemeCss = "";
    private _themeMode = "light";
    private _previewSupportsDark = true;
    private _activeSupportsDark = true;

    constructor(
        private formModelFactory: FormModelFactory.Interface,
        private gateway: RemoteComponentGateway.Interface,
        private previewEvents: SandboxPreviewEvents.Interface
    ) {
        this._form = this.buildForm();
        this._refineForm = this.buildRefineForm();
        makeAutoObservable(this, { vm: computed });
        this.setupReactions();
    }

    get vm(): PresenterAbstraction.ViewModel {
        return {
            loading: this._loading,
            saving: this._saving,
            bundling: this._bundling,
            refining: this._refining,
            component: this._component,
            source: this._source,
            css: this._css,
            error: this._error,
            themeOptions: this._themeOptions,
            selectedThemeId: this._selectedThemeId,
            themeMode: this._themeMode,
            previewSupportsDarkMode: this._previewSupportsDark,
            form: this._form.vm,
            refineForm: this._refineForm.vm,
            bundleStale:
                this._source !== this._lastBundledSource || this._css !== this._lastBundledCss,
            lastBundledOn: this._component?.savedOn ?? null,
            sandbox: this.sandbox
        };
    }

    private get sandbox(): ISandboxVm | null {
        const bundledJs = this._component?.bundledJs;
        if (!bundledJs) {
            return null;
        }

        const manifest = extractManifest(bundledJs);
        if (!manifest) {
            return null;
        }

        return {
            bundledJs,
            bundledCss: this._component!.bundledCss || "",
            componentName: manifest.name,
            manifest
        };
    }

    private buildForm(): IFormModel {
        return this.formModelFactory.create({
            fields: fields => ({
                name: fields.text().label("Name").required("Name is required"),
                label: fields.text().label("Label").required("Label is required"),
                description: fields.text().label("Description").renderer("textarea", { rows: 3 }),
                aiContext: fields
                    .text()
                    .label("AI Context")
                    .renderer("textarea", { rows: 3 })
                    .description(
                        "Describes this component to AI content generation. What the component is and when to use it."
                    )
            }),
            layout: layout => [
                layout.row("name"),
                layout.row("label"),
                layout.row("description"),
                layout.row("aiContext")
            ]
        });
    }

    private buildRefineForm(): IFormModel {
        return this.formModelFactory.create({
            fields: fields => ({
                feedback: fields
                    .text()
                    .label("What should change?")
                    .renderer("textarea", { rows: 4 })
                    .placeholder("Describe the change you want..."),
                additionalFiles: fields.file().list().accept(["image/*"]).label("Reference images")
            }),
            layout: layout => [layout.row("feedback"), layout.row("additionalFiles")]
        });
    }

    async init(id: string) {
        runInAction(() => {
            this._loading = true;
        });

        // Best-effort, in parallel: the theme picker is an enhancement, so a failure to list themes
        // must not block opening the editor — the preview simply falls back to the active theme.
        void this.loadThemeOptions();

        try {
            const component = await this.gateway.get(id);
            runInAction(() => {
                this._component = component;
                this._source = component.source;
                this._css = component.css;
                this._loading = false;
                this._form.setData({
                    name: component.name,
                    label: component.label,
                    description: component.description,
                    aiContext:
                        component.aiContext || sourceEditor.extractAiContext(component.source)
                });
                if (component.bundledJs) {
                    this._lastBundledSource = component.source;
                    this._lastBundledCss = component.css;
                }
            });

            const needsBundle =
                !component.bundledJs ||
                component.source !== this._lastBundledSource ||
                component.css !== this._lastBundledCss;

            if (needsBundle && component.source) {
                await this.bundle();
            }
        } catch (error) {
            runInAction(() => {
                this._error = (error as Error).message;
                this._loading = false;
            });
        }
    }

    private async loadThemeOptions() {
        try {
            const [themes, activeScheme] = await Promise.all([
                this.gateway.listThemes(),
                this.gateway.getActiveThemeColorScheme().catch(() => "light-dark")
            ]);
            runInAction(() => {
                this._themeOptions = themes;
                this._activeSupportsDark = activeScheme !== "single";
                // No theme picked yet: the preview reflects the active theme.
                if (this._selectedThemeId === null) {
                    this._previewSupportsDark = this._activeSupportsDark;
                }
            });
        } catch (error) {
            // The active theme still previews; surface why the picker has no other options.
            console.error("[ComponentEditor] Could not load themes for preview:", error);
        }
    }

    async selectTheme(id: string | null) {
        runInAction(() => {
            this._selectedThemeId = id;
        });

        // Null id clears the override, falling back to the active theme.
        let css = "";
        let supportsDark = this._activeSupportsDark;
        if (id) {
            try {
                const data = await this.gateway.getThemePreviewData(id);
                supportsDark =
                    (data.policy as { colorScheme?: string } | null)?.colorScheme !== "single";
                const snapshot = data.resolved
                    ? (data.resolved as ResolvedThemeSnapshot)
                    : // An unpublished draft has no snapshot — resolve one from its document. Throws if
                      // the draft has publish blockers, which the catch below reports.
                      createResolvedSnapshot({
                          document: data.tokens as TokenDocument,
                          policy: data.policy as ThemePolicy,
                          settings: data.settings as ThemeSettings
                      });
                css = generateCssArtifact(snapshot);
            } catch (error) {
                console.error("[ComponentEditor] Could not render theme CSS for preview:", error);
            }
        }

        runInAction(() => {
            this._selectedThemeCss = css;
            this._previewSupportsDark = supportsDark;
        });
        this.previewEvents.sendThemeCss({ css });

        // A single-scheme theme has no dark — snap the preview back to light so we never sit on a
        // dark view the theme won't render.
        if (!supportsDark && this._themeMode !== "light") {
            this.setThemeMode("light");
        }
    }

    setThemeMode(mode: string) {
        runInAction(() => {
            this._themeMode = mode;
        });
        this.previewEvents.sendThemeMode({ mode });
    }

    setSource(value: string) {
        this._source = value;
    }

    setCss(value: string) {
        this._css = value;
    }

    async save() {
        if (!this._component) {
            return;
        }

        runInAction(() => {
            this._saving = true;
            this._error = null;
        });

        const formData = this._form.getData() as {
            name: string;
            label: string;
            description: string;
            aiContext: string;
        };

        this._source = sourceEditor.updateManifestProperties(this._source, {
            name: formData.name,
            label: formData.label,
            aiContext: formData.aiContext
        });

        try {
            const bundled = await this.buildBundle(formData.name);

            const updated = await this.gateway.update(this._component.id, {
                name: formData.name,
                label: formData.label,
                description: formData.description,
                aiContext: formData.aiContext,
                source: this._source,
                css: this._css,
                bundledJs: bundled.bundled,
                bundledJsSha256: bundled.sha256,
                bundledCss: bundled.css ?? "",
                bundledCssSha256: bundled.cssSha256 ?? ""
            });

            runInAction(() => {
                this._component = updated;
                this._lastBundledSource = this._source;
                this._lastBundledCss = this._css;
                this._saving = false;
            });
        } catch (error) {
            runInAction(() => {
                this._error = (error as Error).message;
                this._saving = false;
            });
        }
    }

    async bundle() {
        if (!this._component) {
            return;
        }

        const formData = this._form.getData() as { name: string };

        runInAction(() => {
            this._bundling = true;
            this._error = null;
        });

        try {
            const bundled = await this.buildBundle(formData.name);

            const updated = await this.gateway.update(this._component.id, {
                bundledJs: bundled.bundled,
                bundledJsSha256: bundled.sha256,
                bundledCss: bundled.css ?? "",
                bundledCssSha256: bundled.cssSha256 ?? ""
            });

            runInAction(() => {
                this._component = updated;
                this._lastBundledSource = this._source;
                this._lastBundledCss = this._css;
                this._bundling = false;
            });
        } catch (error) {
            runInAction(() => {
                this._error = (error as Error).message;
                this._bundling = false;
            });
        }
    }

    private async buildBundle(name: string) {
        return bundleComponentInBrowser({
            name,
            source: this._source,
            css: this._css || undefined
        });
    }

    setDefaultInputs(bindings: Record<string, any>) {
        this._source = sourceEditor.setDefaults(this._source, bindings);
    }

    resetInputs() {
        if (!this._component) {
            return;
        }
        this._source = this._component.source;
        this._css = this._component.css;
    }

    async refine() {
        const data = this._refineForm.getData() as {
            feedback?: string;
            additionalFiles?: Array<{ id: string }>;
        };

        const feedback = (data.feedback || "").trim();
        if (!feedback) {
            return;
        }

        const files = data.additionalFiles;
        const additionalFileIds =
            files && files.length > 0 ? files.map(f => f.id).filter(Boolean) : undefined;

        runInAction(() => {
            this._refining = true;
            this._error = null;
        });

        try {
            await this.gateway.refine({
                currentSource: this._source,
                currentCss: this._css,
                feedback,
                additionalFileIds
            });
        } catch (error) {
            runInAction(() => {
                this._error = (error as Error).message;
                this._refining = false;
            });
        }
    }

    onRefineResult(data: { source: string; css: string }) {
        this._source = data.source;
        this._css = data.css;
        this._refining = false;
    }

    onRefineError(message: string) {
        this._error = message;
        this._refining = false;
    }

    private setupReactions() {
        const events = this.previewEvents;

        this._reactionDisposers.push(
            events.onConnect(() => {
                // Re-apply the previewed theme + mode first, so a reloaded iframe keeps them.
                events.sendThemeCss({ css: this._selectedThemeCss });
                events.sendThemeMode({ mode: this._themeMode });

                const sandbox = this.sandbox;
                if (!sandbox) {
                    return;
                }
                events.sendBundle({
                    componentName: sandbox.componentName,
                    bundledJs: sandbox.bundledJs,
                    bundledCss: sandbox.bundledCss
                });
                events.sendLiveCss({
                    css: this._css,
                    componentName: sandbox.componentName
                });
            })
        );

        this._reactionDisposers.push(
            reaction(
                () => this.sandbox,
                sandbox => {
                    if (!sandbox) {
                        return;
                    }
                    events.sendBundle({
                        componentName: sandbox.componentName,
                        bundledJs: sandbox.bundledJs,
                        bundledCss: sandbox.bundledCss
                    });
                    events.sendLiveCss({
                        css: this._css,
                        componentName: sandbox.componentName
                    });
                    events.sendDocument();
                }
            )
        );

        this._reactionDisposers.push(
            reaction(
                () => this._css,
                css => {
                    const sandbox = this.sandbox;
                    if (!sandbox) {
                        return;
                    }
                    events.sendLiveCss({
                        css,
                        componentName: sandbox.componentName
                    });
                }
            )
        );
    }
}

export const ComponentEditorPresenter = PresenterAbstraction.createImplementation({
    implementation: ComponentEditorPresenterImpl,
    dependencies: [FormModelFactory, RemoteComponentGateway, SandboxPreviewEvents]
});
