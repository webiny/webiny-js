import { OpenSearchFieldFactory as Abstraction } from "./abstractions/OpenSearchFieldFactory.js";
import type { OpenSearchField } from "./abstractions/OpenSearchField.js";
import { OpenSearchFieldImpl } from "./OpenSearchFieldImpl.js";

class OpenSearchFieldFactoryImpl implements Abstraction.Interface {
    public create(params: OpenSearchField.Params): OpenSearchField.Interface {
        return new OpenSearchFieldImpl(params);
    }
}

export const OpenSearchFieldFactory = Abstraction.createImplementation({
    implementation: OpenSearchFieldFactoryImpl,
    dependencies: []
});
