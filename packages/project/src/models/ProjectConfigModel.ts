import {
    type IHydratedProjectConfig,
    type IProjectConfigModel
} from "~/abstractions/models/index.js";
import { type ExtensionInstanceModel } from "~/defineExtension/models/index.js";
import { type z } from "zod";
import { type DefinitionAndComponentPair, type ExtensionComponent } from "~/defineExtension/index.js";

export class ProjectConfigModel implements IProjectConfigModel {
    public readonly config: IHydratedProjectConfig;

    private constructor(config: IHydratedProjectConfig) {
        this.config = config;
    }

    static create(config: IHydratedProjectConfig) {
        return new ProjectConfigModel(config);
    }

    extensionsByType<TParamsSchema extends z.ZodTypeAny>(
        type: string | DefinitionAndComponentPair<TParamsSchema> | ExtensionComponent<TParamsSchema>
    ): Array<ExtensionInstanceModel<TParamsSchema>> {
        let extensionType: string;
        
        if (typeof type === "string") {
            extensionType = type;
        } else {
            // Support both old (.definition) and new (.def) API
            // ExtensionComponent has .def, DefinitionAndComponentPair has .definition
            // Both are guaranteed to have at least one of these properties
            extensionType = type.def?.type || type.definition.type;
        }
        
        return (this.config[extensionType] || []) as unknown as Array<ExtensionInstanceModel<TParamsSchema>>;
    }
}
