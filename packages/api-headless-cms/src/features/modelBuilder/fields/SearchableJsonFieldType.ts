import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { FieldBuilder } from "./FieldBuilder.js";

export interface ISearchableJsonFieldBuilder extends FieldBuilder<"searchable-json"> {}

class SearchableJsonFieldBuilder
    extends FieldBuilder<"searchable-json">
    implements ISearchableJsonFieldBuilder
{
    public constructor() {
        super("searchable-json");
    }
}

class SearchableJsonFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "searchable-json";

    create(): ISearchableJsonFieldBuilder {
        return new SearchableJsonFieldBuilder();
    }
}

export const SearchableJsonFieldType = FieldType.createImplementation({
    implementation: SearchableJsonFieldTypeFactory,
    dependencies: []
});

// Module augmentation for TypeScript autocomplete
declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        searchableJson(): ISearchableJsonFieldBuilder;
    }
}
