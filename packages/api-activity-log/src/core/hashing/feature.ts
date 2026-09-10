import { type Container, createFeature } from "@webiny/feature/api";
import { TargetDerivedHashSalt } from "./TargetDerivedHashSalt.js";
import { ValueHasher } from "./ValueHasher.js";

export const HashingFeature = createFeature({
    name: "ActivityLog/Hashing",
    register(container: Container) {
        container.register(TargetDerivedHashSalt).inSingletonScope();
        container.register(ValueHasher).inSingletonScope();
    }
});
