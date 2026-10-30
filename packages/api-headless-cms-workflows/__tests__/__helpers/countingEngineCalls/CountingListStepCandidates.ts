import type { Container } from "@webiny/di";
import { ListStepCandidatesUseCase } from "@webiny/api-workflows/features/routing/ListStepCandidates/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingListStepCandidates implements ListStepCandidatesUseCase.Interface {
    public constructor(private decoratee: ListStepCandidatesUseCase.Interface) {}

    public async execute(input: ListStepCandidatesUseCase.Input): ListStepCandidatesUseCase.Return {
        engineCalls.push("ListStepCandidates");
        return this.decoratee.execute(input);
    }
}

/** Records every `ListStepCandidatesUseCase` call in `engineCalls` as "ListStepCandidates". */
export const countListStepCandidatesCalls = (container: Container): void => {
    container.registerDecorator(
        ListStepCandidatesUseCase.createDecorator({
            decorator: CountingListStepCandidates,
            dependencies: []
        })
    );
};
