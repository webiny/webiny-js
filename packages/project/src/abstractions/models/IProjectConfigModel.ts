import { type IHydratedProjectConfig } from "~/abstractions/models/IProjectConfigDto.js";
import { type ExtensionInstanceModel } from "~/defineExtension/models/index.js";
import { type ParamsSchemaDefinition } from "~/defineExtension/types.js";
import { type ExtensionComponent } from "~/defineExtension/index.js";

export interface IProjectConfigModel {
    config: IHydratedProjectConfig;

    extensionsByType<TParamsSchema extends ParamsSchemaDefinition | undefined>(
        type: string | ExtensionComponent<TParamsSchema>
    ): ExtensionInstanceModel<TParamsSchema>[];
}
