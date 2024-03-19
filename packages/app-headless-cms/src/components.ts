import {
    DynamicZoneContainer,
    MultiValueContainer,
    MultiValueItemContainer,
    MultiValueItem,
    TemplateGallery
} from "~/admin/plugins/fieldRenderers/dynamicZone";

export const Components = {
    FieldRenderers: {
        DynamicZone: {
            Container: DynamicZoneContainer,
            // SingleValue: {
            //     Container: null,
            //     ItemContainer: null,
            //     Item: null
            // },
            MultiValue: {
                Container: MultiValueContainer,
                ItemContainer: MultiValueItemContainer,
                Item: MultiValueItem
            },
            TemplateGallery
        }
    }
};
