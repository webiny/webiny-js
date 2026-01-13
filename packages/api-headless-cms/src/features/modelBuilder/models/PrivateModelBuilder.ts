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
        if (!this.config.fields) {
            throw new Error("fields are required");
        }

        return createPrivateModelPlugin({
            modelId: this.config.modelId,
            name: this.config.name,
            fields: this.config.fields,
            authorization: false,
            noValidate: true,
            tags: this.getTags()
        });
    }
}
