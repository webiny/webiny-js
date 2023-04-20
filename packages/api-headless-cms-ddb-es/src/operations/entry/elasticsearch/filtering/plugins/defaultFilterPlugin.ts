import WebinyError from "@webiny/error";
import { CmsEntryFilterPlugin } from "~/plugins/CmsEntryFilterPlugin";

export const createDefaultFilterPlugin = () => {
    const plugin = new CmsEntryFilterPlugin({
        fieldType: CmsEntryFilterPlugin.ALL,
        exec: params => {
            const { applyFiltering, field } = params;
            if (!params.field.searchable) {
                const identifier = [...field.parents.map(p => p.fieldId), field.field.fieldId].join(
                    "."
                );
                throw new WebinyError(`Field "${identifier}" is not searchable.`);
            }
            applyFiltering(params);
        }
    });

    plugin.name = `${plugin.type}.default.all`;

    return plugin;
};
