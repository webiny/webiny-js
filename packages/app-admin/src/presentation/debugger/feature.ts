import { createFeature } from "@webiny/feature/admin";
import { DebuggerPresenter as Abstraction } from "./abstractions.js";
import { DebuggerPresenter } from "./DebuggerPresenter.js";

export const DebuggerPresenterFeature = createFeature({
    name: "DebuggerPresenter",
    register(container) {
        // Singleton so the header indicator and the panel read the same state.
        container.register(DebuggerPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
