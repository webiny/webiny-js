import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";
import type {
    ComponentGroupFilterContext,
    ComponentManifest,
    SerializedComponentGroup
} from "@webiny/website-builder-sdk";
import { functionConverter, LayoutContentArea } from "@webiny/website-builder-sdk";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { GLOBAL_COMPONENT_GROUP } from "./globalComponentGroup.js";

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
        // Named content areas are a layout's: pages fill them. Main content is always in a layout already.
        const isLayout = document.metadata?.documentType === "layout";
        const components = Object.values(state.components).filter(item => {
            return !item.hideFromToolbar && (isLayout || !LayoutContentArea.is(item.name));
        });

        return groups.map(group => {
            // A global can be placed any number of times: every placement shows its one instance.
            if (group.name === GLOBAL_COMPONENT_GROUP) {
                return {
                    ...group,
                    items: components.filter(component => component.global)
                };
            }

            const filter = getComponentFilter(group);

            return {
                ...group,
                items: components.filter(component => {
                    return !component.global && filter(component, { document });
                })
            };
        });
    });
};
