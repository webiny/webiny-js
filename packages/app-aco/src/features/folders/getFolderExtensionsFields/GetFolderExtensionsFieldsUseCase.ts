import { FolderModelProvider } from "~/features/folders/abstractions.js";
import {
    GetFolderExtensionsFieldsUseCase as UseCaseAbstraction,
    FolderExtensionsFieldFilter
} from "./abstractions.js";

class GetFolderExtensionsFieldsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private modelProvider: FolderModelProvider.Interface,
        private filters: FolderExtensionsFieldFilter.Interface[]
    ) {}

    async execute() {
        const model = await this.modelProvider.getModel();
        const extensionsField = model.fields.find(f => f.fieldId === "extensions");
        const allFields = extensionsField?.settings?.fields || [];

        // Filter to only fields with tags
        const fieldsWithTags = allFields.filter(field => field.tags?.length);

        // Collect all matching fieldIds from all filters
        const matchingFieldIds = new Set<string>();
        this.filters.forEach(filter => {
            const matchedFields = filter.filter(fieldsWithTags);
            matchedFields.forEach(field => matchingFieldIds.add(field.fieldId));
        });

        // Return fields in original order that match any filter
        const fields = fieldsWithTags.filter(field => matchingFieldIds.has(field.fieldId));

        return fields;
    }
}

export const GetFolderExtensionsFieldsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetFolderExtensionsFieldsUseCaseImpl,
    dependencies: [FolderModelProvider, [FolderExtensionsFieldFilter, { multiple: true }]]
});
