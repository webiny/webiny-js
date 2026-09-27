import { FieldBuilderRegistry } from "../abstractions.js";
import { PrivateModelBuilder } from "./PrivateModelBuilder.js";
import { PublicModelBuilder } from "./PublicModelBuilder.js";

export interface IModelBuilderPrivateInput {
    modelId: string;
    name: string;
    /**
     * Publish entry lifecycle events (`Cms/Entry/*`) for this model. Defaults to `true`.
     *
     * Set to `false` when the model is used as a storage layer, and your own use cases publish
     * app-specific events. No entry event handlers will run for this model: that includes
     * `Before*` handlers (validation, data modification), audit logs, webhooks, etc.
     */
    lifecycleEvents?: boolean;
}

export interface IModelBuilderPublicInput {
    name: string;
    modelId: string;
    group: string;
    singularApiName?: string;
    pluralApiName?: string;
}

/**
 * Entry point builder that allows selecting model type.
 * Call .private() or .public() to get the appropriate typed builder.
 */
export class ModelBuilder {
    public constructor(private registry: FieldBuilderRegistry.Interface) {}

    /**
     * Create a private model (internal models, no GraphQL API).
     */
    public private(input: IModelBuilderPrivateInput): PrivateModelBuilder {
        const model = new PrivateModelBuilder(this.registry);
        model.modelId(input.modelId);
        model.name(input.name);
        if (input.lifecycleEvents === false) {
            model.disableLifecycleEvents();
        }
        return model;
    }

    /**
     * Create a public model (with GraphQL API).
     */
    public public(input: IModelBuilderPublicInput): PublicModelBuilder {
        const model = new PublicModelBuilder(this.registry);
        model.name(input.name);
        model.modelId(input.modelId);
        model.group(input.group);
        if (input.singularApiName) {
            model.singularApiName(input.singularApiName);
        }
        if (input.pluralApiName) {
            model.pluralApiName(input.pluralApiName);
        }
        return model;
    }
}
