import {
    type IHydratedProjectConfig,
    type IProjectConfigModel
} from "~/abstractions/models/index.js";
import { type ExtensionInstanceModel } from "~/defineExtension/models/index.js";
import { type ParamsSchemaDefinition } from "~/defineExtension/types.js";
import { type ExtensionComponent } from "~/defineExtension/index.js";

export class ProjectConfigModel implements IProjectConfigModel {
    public readonly config: IHydratedProjectConfig;

    private constructor(config: IHydratedProjectConfig) {
        this.config = config;
    }

    static create(config: IHydratedProjectConfig) {
        return new ProjectConfigModel(config);
    }

    extensionsByType<TParamsSchema extends ParamsSchemaDefinition | undefined>(
        type: string | ExtensionComponent<TParamsSchema>
    ): Array<ExtensionInstanceModel<TParamsSchema>> {
        let extensionType: string;

        if (typeof type === "string") {
            extensionType = type;
        } else {
            // ExtensionComponent has .def property
            extensionType = type.def.type;
        }

        return (this.config[extensionType] || []) as unknown as Array<
            ExtensionInstanceModel<TParamsSchema>
        >;
    }
}
