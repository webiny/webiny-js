import { OperationsFactory as OperationsFactoryAbstraction } from "./abstractions/OperationsFactory.js";
import { OperationsImpl } from "./Operations.js";

class OperationsFactoryImpl implements OperationsFactoryAbstraction.Interface {
    public create() {
        return new OperationsImpl();
    }
}

export const OperationsFactory = OperationsFactoryAbstraction.createImplementation({
    implementation: OperationsFactoryImpl,
    dependencies: []
});
