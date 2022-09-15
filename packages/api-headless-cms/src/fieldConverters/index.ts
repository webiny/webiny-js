import { CmsModelObjectFieldConverterPlugin } from "~/fieldConverters/CmsModelObjectFieldConverterPlugin";
import { CmsModelDefaultFieldConverterPlugin } from "~/fieldConverters/CmsModelDefaultFieldConverterPlugin";

export const createFieldConverters = () => {
    return [new CmsModelObjectFieldConverterPlugin(), new CmsModelDefaultFieldConverterPlugin()];
};
