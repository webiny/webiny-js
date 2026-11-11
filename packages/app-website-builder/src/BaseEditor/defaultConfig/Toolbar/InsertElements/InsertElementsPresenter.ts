import { computed, makeAutoObservable, observableRef, runInAction } from "mobx";
import type {
    ComponentGroupFilterContext,
    ComponentManifest,
    EditorDocument,
    SerializedComponentGroup
} from "@webiny/website-builder-sdk";
import { functionConverter, LayoutContentArea } from "@webiny/website-builder-sdk";
import type { Editor } from "~/editorSdk/Editor.js";
import { GLOBAL_COMPONENT_GROUP } from "./globalComponentGroup.js";
import { InsertElementsPresenter as PresenterAbstraction } from "./abstractions.js";

const getComponentFilter = (
    group: SerializedComponentGroup
): ((cmp: ComponentManifest, context: ComponentGroupFilterContext) => boolean) => {
    if (group.name === "custom") {
        return cmp => !cmp.group;
    }

    if (group.filter) {
        return functionConverter.deserialize(group.filter!);
    }

    return cmp => cmp.group === group.name;
};

class InsertElementsPresenterImpl implements PresenterAbstraction.Interface {
    private editor: Editor<EditorDocument> | null = null;
    private search = "";
    private view: PresenterAbstraction.View = "list";

    constructor() {
        makeAutoObservable<InsertElementsPresenterImpl, "editor">(
            this,
            {
                vm: computed,
                editor: observableRef
            },
            { autoBind: true }
        );
    }

    get vm(): PresenterAbstraction.ViewModel {
        const query = this.search.toLowerCase().trim();

        const groups = this.groups
            .map(group => {
                const items = query
                    ? group.items.filter(item =>
                          (item.label ?? item.name).toLowerCase().includes(query)
                      )
                    : group.items;

                return { ...group, items };
            })
            .filter(group => group.items.length > 0);

        return {
            search: this.search,
            view: this.view,
            groups
        };
    }

    init<TDocument extends EditorDocument>(editor: Editor<TDocument>) {
        this.editor = editor as unknown as Editor<EditorDocument>;

        return () => {
            runInAction(() => {
                this.editor = null;
            });
        };
    }

    setSearch(search: string) {
        this.search = search;
    }

    setView(view: PresenterAbstraction.View) {
        this.view = view;
    }

    private get groups(): PresenterAbstraction.GroupViewModel[] {
        const editor = this.editor;
        if (!editor) {
            return [];
        }

        const state = editor.getEditorState().read();
        const document = editor.getDocumentState().read();
        // Named content areas are a layout's: pages fill them. Main content is always in a layout already.
        const isLayout = document.metadata?.documentType === "layout";
        const components = Object.values(state.components).filter(item => {
            return !item.hideFromToolbar && (isLayout || !LayoutContentArea.is(item.name));
        });

        return Object.values(state.componentGroups).map(group => {
            // A global can be placed any number of times: every placement shows its one instance.
            if (group.name === GLOBAL_COMPONENT_GROUP) {
                return {
                    name: group.name,
                    label: group.label,
                    icon: group.icon,
                    items: components.filter(component => component.global)
                };
            }

            const filter = getComponentFilter(group);

            return {
                name: group.name,
                label: group.label,
                icon: group.icon,
                items: components.filter(component => {
                    return !component.global && filter(component, { document });
                })
            };
        });
    }
}

export const InsertElementsPresenterRegistration = PresenterAbstraction.createImplementation({
    implementation: InsertElementsPresenterImpl,
    dependencies: []
});
