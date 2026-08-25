import { OpenSearchFieldFactory as Abstraction } from "./abstractions/OpenSearchFieldFactory.js";
import type { OpenSearchField as OpenSearchFieldAbstraction } from "./abstractions/OpenSearchField.js";
import { OpenSearchField } from "./OpenSearchField.js";

class OpenSearchFieldFactoryImpl implements Abstraction.Interface {
    public create(params: OpenSearchFieldAbstraction.Params): OpenSearchFieldAbstraction.Interface {
        return OpenSearchField.create(params);
    }
}

export const OpenSearchFieldFactory = Abstraction.createImplementation({
    implementation: OpenSearchFieldFactoryImpl,
    dependencies: []
});
