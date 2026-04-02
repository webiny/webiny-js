import { createFeature } from "@webiny/feature/api";
import { CmsModelFieldToGraphQLRegistry } from "./fields/CmsModelFieldToGraphQLRegistry.js";
import { BooleanFieldToGraphQL } from "./fields/base/BooleanToGraphQL.js";
import { DateTimeFieldToGraphQL } from "./fields/base/DateTimeToGraphQL.js";
import { FileFieldToGraphQL } from "./fields/base/FileToGraphQL.js";
import { JsonFieldToGraphQL } from "./fields/base/JsonToGraphQL.js";
import { LongTextFieldToGraphQL } from "./fields/base/LongTextToGraphQL.js";
import { NumberFieldToGraphQL } from "./fields/base/NumberToGraphQL.js";
import { ObjectFieldToGraphQL } from "./fields/base/ObjectToGraphQL.js";
import { RefFieldToGraphQL } from "./fields/base/RefToGraphQL.js";
import { SearchableJsonFieldToGraphQL } from "./fields/base/SearchableJsonToGraphQL.js";
import { TextFieldToGraphQL } from "./fields/base/TextToGraphQL.js";

export const GraphQLFeature = createFeature({
    name: "Cms/GraphQLFeature",
    register: container => {
        container.register(BooleanFieldToGraphQL);
        container.register(DateTimeFieldToGraphQL);
        container.register(FileFieldToGraphQL);
        container.register(JsonFieldToGraphQL);
        container.register(LongTextFieldToGraphQL);
        container.register(NumberFieldToGraphQL);
        container.register(ObjectFieldToGraphQL);
        container.register(RefFieldToGraphQL);
        container.register(SearchableJsonFieldToGraphQL);
        container.register(TextFieldToGraphQL);
        container.register(CmsModelFieldToGraphQLRegistry);
    }
});
