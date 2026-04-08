import type { CmsDynamicZoneTemplate } from "~/types/index.js";
import type { GenericRecord } from "@webiny/api/types.js";

export const normalizeDynamicZoneInput = (
    value: GenericRecord<string>,
    templates: CmsDynamicZoneTemplate[]
): GenericRecord<string> | undefined => {
    /* Only one key is allowed in the input object. */
    const inputType = Object.keys(value)[0];
    const template = templates.find(tpl => tpl.gqlTypeName === inputType);

    if (template) {
        return { ...value[inputType], _templateId: template.id };
    }

    return undefined;
};
