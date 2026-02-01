import { createPrivateModelPlugin } from "~/plugins/CmsModelPlugin.js";
import { BaseModelBuilder } from "./BaseModelBuilder.js";

export class PrivateModelBuilder extends BaseModelBuilder {
    build() {
        if (!this.config.modelId) {
            throw new Error("modelId is required");
        }
        if (!this.config.name) {
            throw new Error("name is required");
        }
        if (this.fieldBuildersMap.size === 0) {
            throw new Error("fields are required");
        }

        // Build all fields from field builders
        const fields = Array.from(this.fieldBuildersMap.values()).map(builder => builder.build());

        return createPrivateModelPlugin({
            modelId: this.config.modelId,
            name: this.config.name,
            fields,
            authorization: false,
            noValidate: true,
            tags: this.getTags()
        });
    }
}
