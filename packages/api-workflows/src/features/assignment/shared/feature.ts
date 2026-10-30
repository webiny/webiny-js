import { createFeature } from "@webiny/feature/api";
import { AssignmentModelProvider } from "./AssignmentModelProvider.js";
import { AssignmentRepository } from "./AssignmentRepository.js";

export const AssignmentSharedFeature = createFeature({
    name: "Workflows/AssignmentShared",
    register(container) {
        container.register(AssignmentModelProvider);
        container.register(AssignmentRepository).inSingletonScope();
    }
});
