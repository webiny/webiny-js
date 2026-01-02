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
        if (typeof type !== "string") {
            // Support both old (.definition) and new (.def) API
            type = type.def?.type || type.definition?.type;
        }
        return (this.config[type] || []) as unknown as Array<ExtensionInstanceModel<TParamsSchema>>;
    }
}
