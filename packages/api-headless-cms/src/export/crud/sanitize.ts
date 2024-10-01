import { CmsGroup, CmsModel } from "~/types";
import { SanitizedCmsGroup, SanitizedCmsModel } from "~/export/types";

export const sanitizeGroup = (group: CmsGroup): SanitizedCmsGroup => {
    return {
        id: group.id,
        name: group.name,
        slug: group.slug,
        description: group.description,
        icon: group.icon
    };
};

export const sanitizeModel = (group: Pick<CmsGroup, "id">, model: CmsModel): SanitizedCmsModel => {
    return {
        modelId: model.modelId,
        name: model.name,
        group: group.id,
        icon: model.icon,
        description: model.description,
        singularApiName: model.singularApiName,
        pluralApiName: model.pluralApiName,
        fields: model.fields,
        layout: model.layout,
        titleFieldId: model.titleFieldId,
        descriptionFieldId: model.descriptionFieldId,
        imageFieldId: model.imageFieldId,
        tags: model.tags || []
    };
};
