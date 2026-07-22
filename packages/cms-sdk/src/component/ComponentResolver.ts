import type { ComponentRegistry } from "./ComponentRegistry.js";
import type { CmsModelDefinition } from "../types.js";

export interface ResolvedComponent {
    component: unknown;
    props: Record<string, unknown>;
    templateId: string;
    componentName: string;
}

export class ComponentResolver {
    constructor(private registry: ComponentRegistry) {}

    resolve(items: unknown[], model: CmsModelDefinition): ResolvedComponent[] {
        const componentMap = model.metadata?.componentMap || {};
        const resolved: ResolvedComponent[] = [];

        for (const item of items) {
            if (!item || typeof item !== "object") {
                continue;
            }

            const record = item as Record<string, unknown>;
            const templateId = record._templateId as string | undefined;
            if (!templateId) {
                continue;
            }

            const componentName = componentMap[templateId];
            if (!componentName) {
                continue;
            }

            const component = this.registry.get(componentName);
            if (!component) {
                continue;
            }

            const props: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(record)) {
                if (key === "_templateId" || key === "__typename") {
                    continue;
                }
                props[key] = value;
            }

            resolved.push({
                component: component.component,
                props,
                templateId,
                componentName
            });
        }

        return resolved;
    }
}
