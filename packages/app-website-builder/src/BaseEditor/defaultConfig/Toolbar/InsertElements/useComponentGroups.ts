import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";
import type {
    ComponentGroupFilterContext,
    ComponentManifest,
    SerializedComponentGroup
} from "@webiny/website-builder-sdk";
import { functionConverter } from "@webiny/website-builder-sdk";
import { useDocumentEditor } from "~/DocumentEditor/index.js";

type WithItems<T> = T & { items: ComponentManifest[] };

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

export const useComponentGroups = () => {
    const editor = useDocumentEditor();

    return useSelectFromEditor<WithItems<SerializedComponentGroup>[]>(state => {
        const document = editor.getDocumentState().read();
        const groups = Object.values(state.componentGroups);
        const components = Object.values(state.components).filter(item => !item.hideFromToolbar);

        return groups.map(group => {
            const filter = getComponentFilter(group);

            return {
                ...group,
                items: components.filter(component => {
                    return filter(component, { document });
                })
            };
        });
    });
};
