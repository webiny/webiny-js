import {
    compareStructural,
    computed,
    makeObservable,
    observable,
    observableRef,
    reaction,
    runInAction,
    toJS
} from "mobx";
import {
    type ComponentManifest,
    createGlobalElementDocument,
    type DocumentBindings,
    type EditorDocument,
    ElementBindings,
    GlobalComponentLanguage,
    type GlobalComponentRecord,
    type GlobalDocument,
    GlobalElementId
} from "@webiny/website-builder-sdk";
import type { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import type { Editor } from "~/editorSdk/Editor.js";
import { CommandPriority } from "~/editorSdk/CommandBus.js";
import { Commands } from "~/BaseEditor/commands.js";
import {
    GLOBAL_COMPONENT_GROUP,
    GLOBAL_COMPONENT_GROUP_ICON
} from "~/BaseEditor/defaultConfig/Toolbar/InsertElements/globalComponentGroup.js";
import { $getEditableElement } from "~/editorSdk/utils/$getEditableElement.js";
import type { SaveGlobalComponentUseCase } from "~/features/globals/saveGlobalComponent/abstractions.js";
import { EMPTY_LAYERS, OverrideLayers } from "./OverrideLayers.js";
import { placeGlobalComponent } from "./placeGlobalComponent.js";
import type { GlobalComponentsPresenter } from "./abstractions.js";

export const toRecords = (globalComponents: GlobalComponentRecord[]) => {
    const records: Record<string, GlobalDocument> = {};
    for (const globalComponent of globalComponents) {
        records[GlobalElementId.fromName(globalComponent.name).toString()] = {
            elements: globalComponent.elements,
            bindings: globalComponent.bindings
        };
    }
    return records;
};

const toPlain = <T>(value: T): T => structuredClone(toJS(value));

// The labels of the inputs (and a note for styles) an override holds.
const getOverriddenLabels = (
    override: DocumentBindings[string] | undefined,
    manifest: ComponentManifest | undefined
) => {
    if (!override) {
        return [];
    }

    const labels = Object.keys(override.inputs ?? {}).map(name => {
        const input = manifest?.inputs?.find(input => input.name === name);
        return input?.label ?? name;
    });

    if (override.styles || override.overrides) {
        labels.push("Styles");
    }

    return labels;
};

interface Selection {
    kind: "global" | "layoutElement";
    // The element whose settings are edited: a global's instance (or an element inside it), or a layout's element.
    editedId: string;
    globalId: string | null;
    // The selected element belongs to the page's layout.
    viaLayout: boolean;
}

/**
 * Shared by the page editor and the layout editor: they differ in the document's type, where the layers
 * come from, and which language globals are saved in.
 */
export abstract class GlobalComponentsPresenterBase implements GlobalComponentsPresenter.Interface {
    protected editor: Editor<EditorDocument> | null = null;
    protected layers = new OverrideLayers(EMPTY_LAYERS);
    // Until the records are loaded, globals can't be saved: it isn't known what they hold.
    protected loaded = false;
    /**
     * Whether the records were listed. If listing them failed, globals render from their manifest
     * defaults, but can't be saved in the global component: that would replace a stored record with them.
     */
    protected listed = false;
    private saving = false;
    private listeners: Array<() => void> = [];

    protected abstract readonly documentType: "page" | "layout";

    protected constructor(
        protected saveGlobalComponent: SaveGlobalComponentUseCase.Interface,
        protected notifications: Notifications.Interface
    ) {
        makeObservable<
            GlobalComponentsPresenterBase,
            "editor" | "layers" | "loaded" | "listed" | "saving"
        >(this, {
            vm: computed,
            editor: observableRef,
            layers: observableRef,
            loaded: observable,
            listed: observable,
            saving: observable
        });
    }

    get vm(): GlobalComponentsPresenter.ViewModel {
        const editor = this.editor;
        const selection = this.selection;
        if (!editor || !selection || !this.loaded) {
            return { target: null };
        }

        const document = editor.getDocumentState().read();
        const components = editor.getEditorState().read().components;
        const edited = $getEditableElement(document, selection.editedId);
        const manifest = edited ? components[edited.component.name] : undefined;

        if (selection.kind === "layoutElement") {
            const layoutTitle = document.layout?.properties?.title;
            const override = ElementBindings.from(toJS(document.bindings[selection.editedId]))
                .diffFrom(this.layers.data.layoutBindings[selection.editedId])
                .toJSON();

            return {
                target: {
                    kind: "layoutElement",
                    title: layoutTitle ? `Layout component · ${layoutTitle}` : "Layout component",
                    description:
                        "It belongs to the page's layout. Changes here apply to this page only.",
                    documentType: this.documentType,
                    language: this.language,
                    hasChanges: false,
                    saving: false,
                    overridden: getOverriddenLabels(override, manifest),
                    canSaveToDocument: true,
                    canSaveToGlobal: false,
                    status: "Changes apply to this page only.",
                    ...this.getSaveOptions(true, false)
                }
            };
        }

        const globalId = selection.globalId!;
        const plain = { elements: document.elements, bindings: document.bindings };
        const hasChanges = this.layers.hasChanges(plain, globalId);
        const canSaveToDocument = !this.layers.hasStructureChanges(plain, globalId);

        return {
            target: {
                kind: "global",
                title: selection.viaLayout
                    ? `Global component · ${this.language} · from the layout`
                    : `Global component · ${this.language}`,
                description: `Shared by every page. Its changes are not autosaved: save them for this ${this.documentType} only, or for the global component in "${this.language}".`,
                documentType: this.documentType,
                language: this.language,
                hasChanges,
                saving: this.saving,
                overridden: getOverriddenLabels(this.layers.data.own[selection.editedId], manifest),
                canSaveToDocument,
                canSaveToGlobal: this.listed,
                status: hasChanges ? "Changes detected" : "No unsaved changes",
                ...this.getSaveOptions(canSaveToDocument, this.listed)
            }
        };
    }

    init<TDocument extends EditorDocument>(target: Editor<TDocument>) {
        const editor = target as unknown as Editor<EditorDocument>;
        runInAction(() => {
            this.editor = editor;
            this.saving = false;
        });

        editor.updateEditor(state => {
            state.componentGroups = {
                [GLOBAL_COMPONENT_GROUP]: {
                    name: GLOBAL_COMPONENT_GROUP,
                    label: "Global",
                    description: "Shared by every page. Place them as often as needed.",
                    icon: GLOBAL_COMPONENT_GROUP_ICON
                },
                ...state.componentGroups
            };
        });

        // Dropping a global places it once more: every placement shows its one instance.
        const offCreate = editor.registerCommandHandler(
            Commands.CreateElement,
            (payload, control) => {
                const manifest = editor.getEditorState().read().components[payload.componentName];
                if (!manifest?.global) {
                    return;
                }

                const result = placeGlobalComponent(editor, payload);
                if (result.violation) {
                    this.notifications.warning({ title: result.violation.message });
                }

                return control.stop();
            },
            CommandPriority.HIGH
        );

        const offLayers = this.track(editor);

        // Components are added to the editor state in place, so react to their names.
        const offDefaults = reaction(
            () =>
                Object.values(editor.getEditorState().read().components)
                    .filter(manifest => manifest.global)
                    .map(manifest => manifest.name),
            () => this.fillDefaults(),
            { fireImmediately: true, equals: compareStructural }
        );

        return () => {
            offCreate();
            offDefaults();
            offLayers();
            runInAction(() => {
                this.editor = null;
            });
        };
    }

    async save(target: GlobalComponentsPresenter.SaveTarget) {
        const editor = this.editor;
        const selection = this.selection;
        if (!editor || !selection?.globalId || this.saving || !this.loaded) {
            return;
        }

        const globalId = selection.globalId;
        const document = this.readDocument();

        if (target === "global" && !this.listed) {
            this.notifications.warning({
                title: "Could not save the global component",
                description:
                    "The global components could not be loaded, so saving would overwrite what's stored. Reload the editor and try again."
            });
            return;
        }

        if (target === "document") {
            const overrides = this.layers.getDocumentOverrides(document, globalId);
            runInAction(() => {
                this.layers = this.layers.withOwnFor(document, globalId, overrides);
            });
            this.notifyOverridesChange();
            return;
        }

        const pending = this.layers.getPendingChanges(document, globalId);
        const record = this.layers.getEditedRecord(document, globalId);
        runInAction(() => {
            this.saving = true;
        });

        try {
            const saved = await this.saveGlobalComponent.execute({
                globalComponent: {
                    // A selection's `globalId` is always a global's instance id.
                    name: GlobalElementId.fromId(globalId)!.name,
                    language: this.language,
                    ...record
                }
            });

            runInAction(() => {
                // The document's overrides of what was just saved would hide it: they go.
                const own = withoutPending(this.layers.getOwnFor(document, globalId), pending);
                this.layers = this.layers
                    .with({
                        records: {
                            ...this.layers.data.records,
                            [globalId]: { elements: saved.elements, bindings: saved.bindings }
                        }
                    })
                    .withOwnFor(document, globalId, own);
            });
            this.recompose(globalId);
            this.notifyOverridesChange();
        } catch (error) {
            this.notifications.warning({
                title: "Could not save the global component",
                description: error.message || "unknown error"
            });
        } finally {
            runInAction(() => {
                this.saving = false;
            });
        }
    }

    discard() {
        const selection = this.selection;
        if (!this.editor || !selection?.globalId) {
            return;
        }

        const selectedId = this.editor.getEditorState().read().selectedElement;
        this.recompose(selection.globalId);

        // The selected element may have been added since, and is gone now.
        if (selectedId && !$getEditableElement(this.editor.getDocumentState().read(), selectedId)) {
            this.editor.executeCommand(Commands.SelectElement, { id: selection.globalId });
        }
    }

    resetOverrides() {
        const editor = this.editor;
        const selection = this.selection;
        if (!editor || !selection) {
            return;
        }

        if (selection.kind === "layoutElement") {
            const id = selection.editedId;
            const layoutBindings = this.layers.data.layoutBindings[id];
            editor.updateDocument(document => {
                if (layoutBindings) {
                    document.bindings[id] = structuredClone(layoutBindings);
                } else {
                    delete document.bindings[id];
                }
            });
            return;
        }

        const globalId = selection.globalId!;
        runInAction(() => {
            this.layers = this.layers.withOwnFor(this.readDocument(), globalId, {});
        });
        this.recompose(globalId);
        this.notifyOverridesChange();
    }

    toStoredDocument<T extends EditorDocument>(document: T): T {
        return this.layers.toStored(document);
    }

    onOverridesChange(listener: () => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(item => item !== listener);
        };
    }

    // The language globals are saved in: the document's, or "default" for a document without one.
    protected get language() {
        return GlobalComponentLanguage.from(
            this.editor?.getDocumentState().read().properties?.language
        ).toString();
    }

    // Keep the layers in step with the open document. Returns a function that stops it.
    protected abstract track(editor: Editor<EditorDocument>): () => void;

    // Where "Save changes" can save a global's changes: in the open page or layout only, or in the global itself.
    private getSaveOptions(canSaveToDocument: boolean, canSaveToGlobal: boolean) {
        const notes = [
            canSaveToDocument
                ? null
                : `Elements were added, removed or moved: that can only be saved in the global component.`,
            canSaveToGlobal
                ? null
                : `The global components could not be loaded: reload the editor to save in the global component.`
        ].filter(Boolean);

        const saveOptions: GlobalComponentsPresenter.SaveOptionViewModel[] = [
            {
                value: "document",
                label: `Only on this ${this.documentType}`,
                disabled: !canSaveToDocument
            },
            {
                value: "global",
                label: `Global component (every page in "${this.language}")`,
                disabled: !canSaveToGlobal
            }
        ];

        return {
            saveOptions,
            defaultSaveTarget: (canSaveToDocument
                ? "document"
                : "global") as GlobalComponentsPresenter.SaveTarget,
            saveNote: notes.length ? notes.join(" ") : null
        };
    }

    protected readDocument(): GlobalDocument {
        const document = this.editor!.getDocumentState().read();
        return { elements: toPlain(document.elements), bindings: toPlain(document.bindings) };
    }

    // Put a global's instance back into the document as the layers compose it. Instances are kept out of
    // the undo history, so this adds no undo step.
    protected recompose(globalId: string) {
        this.editor?.updateDocument(document => {
            this.layers.composeGlobal(document as unknown as GlobalDocument, globalId);
        });
    }

    protected notifyOverridesChange() {
        this.listeners.forEach(listener => listener());
    }

    /**
     * A global defined in code has no record until it's saved: it gets its instance from its manifest
     * defaults, so it shows up right away.
     */
    protected fillDefaults() {
        const editor = this.editor;
        if (!editor || !this.loaded) {
            return;
        }

        const components = toPlain(editor.getEditorState().read().components);
        const missing = Object.values(components).filter(manifest => {
            return (
                manifest.global &&
                !this.layers.data.records[GlobalElementId.fromName(manifest.name).toString()]
            );
        });

        if (!missing.length) {
            return;
        }

        const records = { ...this.layers.data.records };
        missing.forEach(manifest => {
            records[GlobalElementId.fromName(manifest.name).toString()] =
                createGlobalElementDocument(manifest.name, components);
        });

        runInAction(() => {
            this.layers = this.layers.with({ records });
        });

        editor.updateDocument(document => {
            missing.forEach(manifest => {
                this.layers.composeGlobal(
                    document as unknown as GlobalDocument,
                    GlobalElementId.fromName(manifest.name).toString()
                );
            });
        });
    }

    private get selection(): Selection | null {
        const editor = this.editor;
        if (!editor) {
            return null;
        }

        const selectedId = editor.getEditorState().read().selectedElement;
        if (!selectedId) {
            return null;
        }

        const document = editor.getDocumentState().read();
        const components = editor.getEditorState().read().components;
        const selected = $getEditableElement(document, selectedId);
        if (!selected) {
            return null;
        }

        const viaLayout = this.layers.isLayoutElement(selectedId);

        if (GlobalElementId.isPlacement(selected, components)) {
            const globalId = GlobalElementId.fromName(selected.component.name).toString();
            return { kind: "global", editedId: globalId, globalId, viaLayout };
        }

        const globalId = GlobalElementId.rootOf(document.elements, selectedId)?.toString();
        if (globalId) {
            return { kind: "global", editedId: selectedId, globalId, viaLayout: false };
        }

        if (viaLayout) {
            return { kind: "layoutElement", editedId: selectedId, globalId: null, viaLayout };
        }

        return null;
    }
}

/**
 * The document's overrides of a global, without the inputs (and styles) just saved in the global itself:
 * the saved values show, instead of being hidden by the document's older ones.
 */
const withoutPending = (own: DocumentBindings, pending: DocumentBindings): DocumentBindings => {
    const result: DocumentBindings = {};
    for (const id in own) {
        const inputs = { ...own[id].inputs };
        const styles = { ...own[id].styles };
        Object.keys(pending[id]?.inputs ?? {}).forEach(name => delete inputs[name]);
        Object.keys(pending[id]?.styles ?? {}).forEach(name => delete (styles as any)[name]);

        const kept = {
            ...own[id],
            inputs: Object.keys(inputs).length ? inputs : undefined,
            styles: Object.keys(styles).length ? styles : undefined,
            overrides: pending[id]?.overrides ? undefined : own[id].overrides
        };
        if (kept.inputs || kept.styles || kept.overrides) {
            result[id] = JSON.parse(JSON.stringify(kept));
        }
    }
    return result;
};
