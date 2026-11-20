import { runInAction } from "mobx";
import { type EditorDocument, type GlobalDocument } from "@webiny/website-builder-sdk";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import type { Editor } from "~/editorSdk/Editor.js";
import { SaveGlobalComponentUseCase } from "~/features/globals/saveGlobalComponent/abstractions.js";
import { ListGlobalComponentsUseCase } from "~/features/globals/listGlobalComponents/abstractions.js";
import {
    GlobalComponentsPresenterBase,
    toRecords
} from "~/presentation/globals/overrides/GlobalComponentsPresenterBase.js";
import {
    EMPTY_LAYERS,
    OverrideLayers,
    splitStoredOverrides
} from "~/presentation/globals/overrides/OverrideLayers.js";
import { LayoutGlobalComponentsPresenter as PresenterAbstraction } from "./abstractions.js";

class LayoutGlobalComponentsPresenterImpl
    extends GlobalComponentsPresenterBase
    implements PresenterAbstraction.Interface
{
    protected readonly documentType = "layout" as const;

    constructor(
        saveGlobalComponent: SaveGlobalComponentUseCase.Interface,
        notifications: Notifications.Interface,
        private listGlobalComponents: ListGlobalComponentsUseCase.Interface
    ) {
        super(saveGlobalComponent, notifications);
    }

    protected track(editor: Editor<EditorDocument>) {
        let active = true;

        // The layout's overrides of globals are known right away, so a save before the records load keeps them.
        const document = editor.getDocumentState().read();
        const { own } = splitStoredOverrides({
            elements: document.elements,
            bindings: JSON.parse(JSON.stringify(document.bindings))
        });

        runInAction(() => {
            this.loaded = false;
            this.listed = false;
            this.layers = new OverrideLayers({ ...EMPTY_LAYERS, own });
        });

        void this.loadRecords(editor, () => active);

        return () => {
            active = false;
        };
    }

    private async loadRecords(editor: Editor<EditorDocument>, isActive: () => boolean) {
        let records: Record<string, GlobalDocument> = {};
        let listed = false;
        try {
            records = toRecords(
                await this.listGlobalComponents.execute({ language: this.language, fallback: true })
            );
            listed = true;
        } catch (error) {
            this.notifications.warning({
                title: "Could not load the global components",
                description: `${error.message || "unknown error"}. They show their defaults, and can't be saved in the global component until the editor is reloaded.`
            });
        }

        if (!isActive()) {
            return;
        }

        runInAction(() => {
            this.layers = this.layers.with({ records });
            this.loaded = true;
            this.listed = listed;
        });

        editor.updateDocument(document => {
            Object.keys(records).forEach(globalId => {
                this.layers.composeGlobal(document as unknown as GlobalDocument, globalId);
            });
        });

        this.fillDefaults();
    }
}

export const LayoutGlobalComponentsPresenterRegistration =
    PresenterAbstraction.createImplementation({
        implementation: LayoutGlobalComponentsPresenterImpl,
        dependencies: [SaveGlobalComponentUseCase, Notifications, ListGlobalComponentsUseCase]
    });
