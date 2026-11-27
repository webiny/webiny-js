import { createFeature } from "@webiny/feature/admin";
import { TestMailPresenter as Abstraction } from "./abstractions.js";
import { TestMailRuns } from "./abstractions.js";
import { TestMailState } from "./abstractions.js";
import { TestMailPresenter } from "./TestMailPresenter.js";
import { TestMailStore } from "./TestMailStore.js";

export const TestMailPresenterFeature = createFeature({
    name: "Mailer/TestMailPresenter",
    register(container) {
        const store = new TestMailStore();
        container.registerInstance(TestMailState, store);
        container.registerInstance(TestMailRuns, store);
        container.register(TestMailPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
