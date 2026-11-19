import { createFeature } from "@webiny/feature/admin";
import { TestMailPresenter as Abstraction } from "./abstractions.js";
import { TestMailPresenter } from "./TestMailPresenter.js";
import { TestMailState } from "./TestMailState.js";

export const TestMailPresenterFeature = createFeature({
    name: "Mailer/TestMailPresenter",
    register(container) {
        container.register(TestMailState).inSingletonScope();
        container.register(TestMailPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
