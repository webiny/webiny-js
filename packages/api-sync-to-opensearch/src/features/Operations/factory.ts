import type { IOperationsFactory } from "./abstraction.js";
import { OperationsFactory } from "./abstraction.js";
import { OperationsImpl } from "./implementation.js";

class OperationsFactoryImpl implements IOperationsFactory {
    public create() {
        return new OperationsImpl();
    }
}

export const OperationsFactoryImplementation = OperationsFactory.createImplementation({
    implementation: OperationsFactoryImpl,
    dependencies: []
});
