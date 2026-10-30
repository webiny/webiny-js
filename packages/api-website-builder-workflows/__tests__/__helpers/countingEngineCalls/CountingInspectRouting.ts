import type { Container } from "@webiny/di";
import { InspectRoutingUseCase } from "@webiny/api-workflows/features/routing/InspectRouting/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingInspectRouting implements InspectRoutingUseCase.Interface {
    public constructor(private decoratee: InspectRoutingUseCase.Interface) {}

    public async execute(input: InspectRoutingUseCase.Input): InspectRoutingUseCase.Return {
        engineCalls.push("InspectRouting");
        return this.decoratee.execute(input);
    }
}

/** Records every `InspectRoutingUseCase` call in `engineCalls` as "InspectRouting". */
export const countInspectRoutingCalls = (container: Container): void => {
    container.registerDecorator(
        InspectRoutingUseCase.createDecorator({
            decorator: CountingInspectRouting,
            dependencies: []
        })
    );
};
