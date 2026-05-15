import { createFeature } from "@webiny/feature/api";
import { CmsModelFieldToGraphQLRegistry } from "./fields/CmsModelFieldToGraphQLRegistry.js";
import { BooleanFieldToGraphQL } from "./fields/base/BooleanToGraphQL.js";
import { DateTimeFieldToGraphQL } from "./fields/base/DateTimeToGraphQL.js";
import { DynamicZoneFieldToGraphQL } from "./fields/base/DynamicZoneToGraphQL.js";
import { FileFieldToGraphQL } from "./fields/base/FileToGraphQL.js";
import { JsonFieldToGraphQL } from "./fields/base/JsonToGraphQL.js";
import { LongTextFieldToGraphQL } from "./fields/base/LongTextToGraphQL.js";
import { NumberFieldToGraphQL } from "./fields/base/NumberToGraphQL.js";
import { ObjectFieldToGraphQL } from "./fields/base/ObjectToGraphQL.js";
import { RefFieldToGraphQL } from "./fields/base/RefToGraphQL.js";
import { SearchableJsonFieldToGraphQL } from "./fields/base/SearchableJsonToGraphQL.js";
import { TextFieldToGraphQL } from "./fields/base/TextToGraphQL.js";
import { RichTextFieldToGraphQL } from "./fields/base/RichTextToGraphQL.js";

export const GraphQLFeature = createFeature({
    name: "Cms/GraphQLFeature",
    register: container => {
        container.register(BooleanFieldToGraphQL).inSingletonScope();
        container.register(DateTimeFieldToGraphQL).inSingletonScope();
        container.register(DynamicZoneFieldToGraphQL).inSingletonScope();
        container.register(FileFieldToGraphQL).inSingletonScope();
        container.register(JsonFieldToGraphQL).inSingletonScope();
        container.register(LongTextFieldToGraphQL).inSingletonScope();
        container.register(NumberFieldToGraphQL).inSingletonScope();
        container.register(ObjectFieldToGraphQL).inSingletonScope();
        container.register(RefFieldToGraphQL).inSingletonScope();
        container.register(RichTextFieldToGraphQL).inSingletonScope();
        container.register(SearchableJsonFieldToGraphQL).inSingletonScope();
        container.register(TextFieldToGraphQL).inSingletonScope();

        container.register(CmsModelFieldToGraphQLRegistry).inSingletonScope();
    }
});
