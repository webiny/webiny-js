import { createPrivateModelPlugin } from "~/plugins/CmsModelPlugin.js";
import { BaseModelBuilder } from "./BaseModelBuilder.js";

export class PrivateModelBuilder extends BaseModelBuilder {
    private lifecycleEvents = true;

    /**
     * @internal Use `builder.private({ lifecycleEvents: false })` instead.
     */
    public disableLifecycleEvents(): this {
        this.lifecycleEvents = false;
        return this;
    }

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

        const settings = { ...(this.config.settings || {}) };
        if (!this.lifecycleEvents) {
            settings.lifecycleEvents = false;
        }

        return createPrivateModelPlugin({
            modelId: this.config.modelId,
            name: this.config.name,
            fields,
            authorization: false,
            noValidate: true,
            tags: this.getTags(),
            settings
        });
    }
}
