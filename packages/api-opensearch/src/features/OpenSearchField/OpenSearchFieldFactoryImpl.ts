import { OpenSearchFieldFactory } from "./abstractions/OpenSearchFieldFactory.js";
import type { OpenSearchField } from "./abstractions/OpenSearchField.js";
import { OpenSearchFieldImpl } from "./OpenSearchFieldImpl.js";

class OpenSearchFieldFactoryImplClass implements OpenSearchFieldFactory.Interface {
    public create(params: OpenSearchField.Params): OpenSearchField.Interface {
        return new OpenSearchFieldImpl(params);
    }
}

export const OpenSearchFieldFactoryImpl = OpenSearchFieldFactory.createImplementation({
    implementation: OpenSearchFieldFactoryImplClass,
    dependencies: []
});
