import { createFeature } from "@webiny/feature/admin";
import { AdminAssistantGateway } from "./AdminAssistantGateway.js";
import { AdminAssistantPresenter } from "./AdminAssistantPresenter.js";
import { AdminAssistantPresenter as Abstraction } from "./abstractions.js";

export const AdminAssistantFeature = createFeature({
    name: "AdminAssistant",
    register(container) {
        container.register(AdminAssistantGateway);
        // Singleton so the conversation survives re-renders of the palette that reads it.
        container.register(AdminAssistantPresenter).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(Abstraction) };
    }
});
