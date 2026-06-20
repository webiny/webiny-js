import { CmsFieldType } from "../abstractions.js";

class SearchableJsonFieldTypeImpl implements CmsFieldType.Interface {
    type = "searchable-json";
    label = "Searchable JSON";
    description = "Store Searchable JSON values.";
    icon = "fas/data-object";
    allowList = true;
    listLabel = "Use as a list of Searchable JSONs";
    allowPredefinedValues = true;

    createField() {
        return {
            type: this.type,
            validation: [],
            renderer: { name: "" },
            settings: { defaultValue: false }
        };
    }
}

export const SearchableJsonFieldType = CmsFieldType.createImplementation({
    implementation: SearchableJsonFieldTypeImpl,
    dependencies: []
});
