import type { CmsModelAst } from "@webiny/api-headless-cms/types";
import { ContentEntryTraverser } from "@webiny/api-headless-cms/features/contentEntry/ContentEntryTraverser/ContentEntryTraverser.js";
import { createTypeName } from "@webiny/api-headless-cms/utils/createTypeName.js";

interface DynamicZoneTemplate {
    id: string;
    gqlTypeName: string;
}

export async function injectDynamicZoneTypenames(
    values: Record<string, any>,
    modelAst: CmsModelAst,
    singularApiName: string
): Promise<void> {
    const traverser = new ContentEntryTraverser(modelAst);

    const graphQLTypeMap = new Map<string, string>();
    graphQLTypeMap.set("", singularApiName);

    await traverser.traverse(values, async ({ field, value, path }) => {
        if (field.type !== "dynamicZone" || value == null) {
            return;
        }

        const pathParts = path.split(".");
        const parentPrefix = pathParts.slice(0, -1).join(".");
        const enclosingType = graphQLTypeMap.get(parentPrefix) || singularApiName;
        const typeName = `${enclosingType}_${createTypeName(field.fieldId)}`;

        const templates: DynamicZoneTemplate[] = field.settings?.templates || [];
        const items: Record<string, any>[] = field.list && Array.isArray(value) ? value : [value];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item || !item._templateId) {
                continue;
            }

            const template = templates.find(t => t.id === item._templateId);
            if (!template) {
                continue;
            }

            item.__typename = `${typeName}_${template.gqlTypeName}`;

            const itemPath = field.list ? `${path}.${i}` : path;
            graphQLTypeMap.set(itemPath, item.__typename);
        }
    });
}
