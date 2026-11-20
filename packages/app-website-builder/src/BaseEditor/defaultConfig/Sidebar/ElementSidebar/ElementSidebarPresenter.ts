import { action, computed, makeObservable, observableRef } from "mobx";
import {
    ComponentManifestToAstConverter,
    type EditorDocument,
    GlobalElementId,
    LayoutContentArea
} from "@webiny/website-builder-sdk";
import type { Editor } from "~/editorSdk/Editor.js";
import { Commands } from "~/BaseEditor/commands.js";
import { $getEditableElement, $isLayoutElement } from "~/editorSdk/utils/$getEditableElement.js";
import { ElementSidebarPresenter as PresenterAbstraction } from "./abstractions.js";

const getLayoutAreaDescription = (area: string | null) => {
    if (area === LayoutContentArea.MAIN) {
        return "This is the layout's main content area. Drop this page's content into it.";
    }
    if (area) {
        return `This is the layout's "${area}" content area. Drop this page's content into it. Rename it in the layout editor.`;
    }
    return "This is one of the layout's named content areas. Drop this page's content into it. Name it in the layout editor.";
};

class ElementSidebarPresenterImpl implements PresenterAbstraction.Interface {
    private editor: Editor<EditorDocument> | null = null;

    constructor() {
        makeObservable<ElementSidebarPresenterImpl, "editor">(this, {
            vm: computed,
            editor: observableRef,
            init: action
        });
    }

    init(editor: Editor<EditorDocument>) {
        this.editor = editor;
    }

    get vm(): PresenterAbstraction.ViewModel {
        const editor = this.editor;
        const selectedId = editor?.getEditorState().read().selectedElement;
        if (!editor || !selectedId) {
            return { element: null };
        }

        const document = editor.getDocumentState().read();
        const components = editor.getEditorState().read().components;
        const element = $getEditableElement(document, selectedId);
        if (!element) {
            return { element: null };
        }

        const editedId = GlobalElementId.bindingsIdOf(element, components);

        return {
            element: {
                id: element.id,
                componentName: element.component.name,
                actions: this.getActions(element.id, element.component.name),
                settings: $getEditableElement(document, editedId)
                    ? this.getSettings(editedId)
                    : null
            }
        };
    }

    getSettings(elementId: string): PresenterAbstraction.SettingsViewModel {
        const document = this.editor!.getDocumentState().read();
        const components = this.editor!.getEditorState().read().components;

        // An area belongs to the layout: a page can't rename it.
        const area = $isLayoutElement(document, elementId)
            ? LayoutContentArea.from(document.layout!, elementId)
            : null;
        if (area) {
            return {
                elementId,
                layoutArea: {
                    name: area.name(),
                    description: getLayoutAreaDescription(area.name())
                },
                message: null,
                inputs: []
            };
        }

        const element = $getEditableElement(document, elementId);
        const component = element ? components[element.component.name] : undefined;
        const inputs = ComponentManifestToAstConverter.convert(component?.inputs ?? [])
            .filter(node => node.type !== "slot")
            .map(node => ({ name: node.name, label: node.input.label ?? node.name }));

        return {
            elementId,
            layoutArea: null,
            message: inputs.length ? null : "This element has no inputs.",
            inputs
        };
    }

    deleteElement() {
        const element = this.vm.element;
        if (element?.actions.delete) {
            this.editor!.executeCommand(Commands.DeleteElement, { id: element.id });
        }
    }

    cloneElement() {
        const element = this.vm.element;
        if (element?.actions.clone) {
            this.editor!.executeCommand(Commands.CloneElement, { id: element.id });
        }
    }

    private getActions(id: string, componentName: string) {
        const document = this.editor!.getDocumentState().read();
        const isLayoutElement = $isLayoutElement(document, id);
        const isGlobal = GlobalElementId.isGlobal(id);
        const isMainContentArea =
            componentName === LayoutContentArea.MAIN_COMPONENT &&
            LayoutContentArea.mainWithin(document, id);

        return {
            // A layout's elements can't be deleted from the page, a global's instance isn't in the tree (its
            // placements are), and a layout always has its main page content area.
            delete: !isLayoutElement && !isGlobal && !isMainContentArea,
            // A layout holds exactly one page content, its elements can't be changed from the page, and a
            // global's instance isn't in the tree (its placements are, and can be cloned).
            clone: !LayoutContentArea.anyWithin(document, id) && !isLayoutElement && !isGlobal
        };
    }
}

export const ElementSidebarPresenterRegistration = PresenterAbstraction.createImplementation({
    implementation: ElementSidebarPresenterImpl,
    dependencies: []
});
