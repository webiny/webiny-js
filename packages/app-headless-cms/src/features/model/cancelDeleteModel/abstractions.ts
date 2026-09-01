import { createAbstraction } from "@webiny/feature/admin";

export interface ICancelDeleteModelGateway {
    execute(modelId: string): Promise<void>;
}

export const CancelDeleteModelGateway = createAbstraction<ICancelDeleteModelGateway>(
    "CancelDeleteModelGateway"
);

export namespace CancelDeleteModelGateway {
    export type Interface = ICancelDeleteModelGateway;
}

export interface ICancelDeleteModelRepository {
    execute(modelId: string): Promise<void>;
}

export const CancelDeleteModelRepository = createAbstraction<ICancelDeleteModelRepository>(
    "CancelDeleteModelRepository"
);

export namespace CancelDeleteModelRepository {
    export type Interface = ICancelDeleteModelRepository;
}

export interface ICancelDeleteModelUseCase {
    execute(modelId: string): Promise<void>;
}

export const CancelDeleteModelUseCase = createAbstraction<ICancelDeleteModelUseCase>(
    "CancelDeleteModelUseCase"
);

export namespace CancelDeleteModelUseCase {
    export type Interface = ICancelDeleteModelUseCase;
}
