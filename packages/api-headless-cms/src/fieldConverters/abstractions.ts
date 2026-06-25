import { createAbstraction } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import type { CmsModelFieldConverterPlugin } from "~/plugins/CmsModelFieldConverterPlugin.js";
import { CmsModelObjectFieldConverterPlugin } from "~/fieldConverters/CmsModelObjectFieldConverterPlugin.js";
import { CmsModelDefaultFieldConverterPlugin } from "~/fieldConverters/CmsModelDefaultFieldConverterPlugin.js";
import { CmsModelDynamicZoneFieldConverterPlugin } from "~/fieldConverters/CmsModelDynamicZoneFieldConverterPlugin.js";

/**
 * Multi-instance DI token for CMS field value converters (fieldId <-> storageId).
 * Replaces reading CmsModelFieldConverterPlugin instances from the plugins container.
 */
export const CmsFieldConverter =
    createAbstraction<CmsModelFieldConverterPlugin>("CmsFieldConverter");

export namespace CmsFieldConverter {
    export type Interface = CmsModelFieldConverterPlugin;
}

/**
 * Registers the built-in field converters as CmsFieldConverter implementations.
 */
export const registerFieldConverters = (container: Container): void => {
    container.registerInstance(CmsFieldConverter, new CmsModelObjectFieldConverterPlugin());
    container.registerInstance(CmsFieldConverter, new CmsModelDynamicZoneFieldConverterPlugin());
    container.registerInstance(CmsFieldConverter, new CmsModelDefaultFieldConverterPlugin());
};
