import { createPrivateModelPlugin } from "~/plugins/CmsModelPlugin.js";
import { BaseModelBuilder } from "./BaseModelBuilder.js";

export class PrivateModelBuilder extends BaseModelBuilder {
    public build() {
        if (!this.config.modelId) {
            throw new Error("modelId is required");
        }
        if (!this.config.name) {
            throw new Error("name is required");
        }
        if (this.fieldBuildersMap.size === 0) {
            throw new Error("fields are required");
        }

        // Build all fields from field builders (layout replacements ignored for private models)
        const { fields } = this.buildFields();

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
