import { computed, makeAutoObservable, observableRef, runInAction } from "mobx";
import { type EditorDocument, LayoutContentArea } from "@webiny/website-builder-sdk";
import type { Editor } from "~/editorSdk/Editor.js";
import { CommandPriority } from "~/editorSdk/CommandBus.js";
import { Commands } from "~/BaseEditor/commands.js";
import { GetSettingsUseCase } from "~/features/settings/getSettings/abstractions/index.js";
import { GetLayoutUseCase, getLayoutErrorMessage } from "~/features/layouts/index.js";
import { LayoutEditorPresenter as PresenterAbstraction } from "./abstractions.js";
import { LayoutIdentity } from "~/domain/Layout/index.js";
import { type LayoutEditorDocument, layoutToEditorDocument } from "./layoutDocument.js";

class LayoutEditorPresenterImpl implements PresenterAbstraction.Interface {
    private document: LayoutEditorDocument | null = null;
    private error: string | null = null;
    // The layout being loaded: a load for another layout finishing later is ignored.
    private loadingId: string | null = null;

    constructor(
        private getSettings: GetSettingsUseCase.Interface,
        private getLayout: GetLayoutUseCase.Interface
    ) {
        makeAutoObservable<LayoutEditorPresenterImpl, "document" | "getSettings" | "getLayout">(
            this,
            {
                vm: computed,
                document: observableRef,
                getSettings: false,
                getLayout: false
            },
            { autoBind: true }
        );
    }

    get vm(): PresenterAbstraction.ViewModel {
        return {
            loading: !this.document && !this.error,
            error: this.error,
            document: this.document,
            readOnly: this.document ? LayoutIdentity.from(this.document).isReadOnly() : false
        };
    }

    async load(id: string) {
        this.loadingId = id;
        this.document = null;
        this.error = null;

        try {
            const [, layout] = await Promise.all([
                this.getSettings.execute(),
                this.getLayout.execute(id)
            ]);
            runInAction(() => {
                if (this.loadingId === id) {
                    this.document = layoutToEditorDocument(layout);
                }
            });
        } catch (error) {
            runInAction(() => {
                if (this.loadingId === id) {
                    this.error = getLayoutErrorMessage(error);
                }
            });
        }
    }

    nameContentAreas<TDocument extends EditorDocument>(editor: Editor<TDocument>) {
        // Named content dropped without bindings gets a name; it's only a label, and can be renamed.
        return editor.registerCommandHandler(
            Commands.CreateElement,
            (payload, control) => {
                if (
                    payload.componentName !== LayoutContentArea.NAMED_COMPONENT ||
                    payload.bindings
                ) {
                    return;
                }

                editor.executeCommand(Commands.CreateElement, {
                    ...payload,
                    bindings: {
                        inputs: {
                            [LayoutContentArea.NAME_INPUT]: this.nextAreaName(
                                editor.getDocumentState().read()
                            )
                        }
                    }
                });

                return control.stop();
            },
            CommandPriority.HIGH
        );
    }

    // The first `area-{n}` not taken, counting from the number of areas the layout already has.
    private nextAreaName(document: EditorDocument) {
        const names = new Set(LayoutContentArea.allIn(document).map(area => area.name()));

        let index = names.size + 1;
        while (names.has(`area-${index}`)) {
            index++;
        }

        return `area-${index}`;
    }
}

export const LayoutEditorPresenterRegistration = PresenterAbstraction.createImplementation({
    implementation: LayoutEditorPresenterImpl,
    dependencies: [GetSettingsUseCase, GetLayoutUseCase]
});
