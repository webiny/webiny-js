import {
    DynamicZoneContainer,
    MultiValueContainer,
    MultiValueItemContainer,
    MultiValueItem,
    TemplateGallery,
    useTemplate
} from "~/admin/plugins/fieldRenderers/dynamicZone";
import { ContentEntryForm as BaseContentEntryForm } from "./admin/components/ContentEntryForm/ContentEntryForm";
import { ContentEntryFormPreview } from "./admin/components/ContentEntryForm/ContentEntryFormPreview";
import { useContentEntryForm } from "./admin/components/ContentEntryForm/useContentEntryForm";
import { useContentEntry } from "~/admin/views/contentEntries/hooks";

export const Components = {
    ContentEntry: {
        useContentEntry,
        ContentEntryForm: Object.assign(BaseContentEntryForm, {
            useContentEntryForm,
        }),
        ContentEntryFormPreview
    },
    FieldRenderers: {
        DynamicZone: {
            Template: {
                useTemplate
            },
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
