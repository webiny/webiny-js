import { type IHydratedProjectConfig } from "~/abstractions/models/IProjectConfigDto.js";
import { type ExtensionInstanceModel } from "~/defineExtension/models/index.js";
import { type z } from "zod";
import { type DefinitionAndComponentPair, type ExtensionComponent } from "~/defineExtension/index.js";

export interface IProjectConfigModel {
    config: IHydratedProjectConfig;

    extensionsByType<TParamsSchema extends z.ZodTypeAny>(
        type: string | DefinitionAndComponentPair<TParamsSchema> | ExtensionComponent<TParamsSchema>
    ): ExtensionInstanceModel<TParamsSchema>[];
}
