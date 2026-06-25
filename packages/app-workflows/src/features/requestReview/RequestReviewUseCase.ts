import {
    RequestReviewUseCase as UseCaseAbstraction,
    RequestReviewGateway,
    type IRequestReviewParams
} from "./abstractions.js";

class RequestReviewUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: RequestReviewGateway.Interface) {}

    async execute(params: IRequestReviewParams) {
        return this.gateway.execute(params);
    }
}

export const RequestReviewUseCase = UseCaseAbstraction.createImplementation({
    implementation: RequestReviewUseCaseImpl,
    dependencies: [RequestReviewGateway]
});
