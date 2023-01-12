import { CmsModelObjectFieldConverterPlugin } from "~/fieldConverters/CmsModelObjectFieldConverterPlugin";
import { CmsModelDefaultFieldConverterPlugin } from "~/fieldConverters/CmsModelDefaultFieldConverterPlugin";
import { CmsModelDynamicZoneFieldConverterPlugin } from "~/fieldConverters/CmsModelDynamicZoneFieldConverterPlugin";

export const createFieldConverters = () => {
    return [
        new CmsModelObjectFieldConverterPlugin(),
        new CmsModelDynamicZoneFieldConverterPlugin(),
        new CmsModelDefaultFieldConverterPlugin()
    ];
};
