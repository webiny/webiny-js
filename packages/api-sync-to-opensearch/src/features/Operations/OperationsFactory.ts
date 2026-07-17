import { OperationsFactory as OperationsFactoryAbstraction } from "./abstractions/OperationsFactory.js";
import { Operations } from "./Operations.js";

class OperationsFactoryImpl implements OperationsFactoryAbstraction.Interface {
    public create() {
        return new Operations();
    }
}

export const OperationsFactory = OperationsFactoryAbstraction.createImplementation({
    implementation: OperationsFactoryImpl,
    dependencies: []
});
