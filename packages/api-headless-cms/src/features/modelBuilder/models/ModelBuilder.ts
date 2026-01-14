import { FieldBuilderRegistry } from "~/features/modelBuilder/index.js";
import { PrivateModelBuilder } from "./PrivateModelBuilder.js";
import { PublicModelBuilder } from "./PublicModelBuilder.js";

/**
 * Entry point builder that allows selecting model type.
 * Call .private() or .public() to get the appropriate typed builder.
 */
export class ModelBuilder {
    public constructor(private registry: FieldBuilderRegistry.Interface) {}

    /**
     * Create a private model (internal models, no GraphQL API).
     */
    private(): PrivateModelBuilder {
        return new PrivateModelBuilder(this.registry);
    }

    /**
     * Create a public model (with GraphQL API).
     */
    public(): PublicModelBuilder {
        return new PublicModelBuilder(this.registry);
    }
}
