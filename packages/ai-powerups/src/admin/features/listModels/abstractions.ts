import { createAbstraction } from "@webiny/feature/admin";

export interface IListModelsUseCase {
  execute(): Promise<void>;
}

export const ListModelsUseCase = createAbstraction<IListModelsUseCase>(
  "AiPowerUps/ListModelsUseCase",
);
export namespace ListModelsUseCase {
  export type Interface = IListModelsUseCase;
}

export interface IListModelsRepository {
  execute(): Promise<void>;
  getModels(): AiModel[];
}

export const ListModelsRepository = createAbstraction<IListModelsRepository>(
  "AiPowerUps/ListModelsRepository",
);
export namespace ListModelsRepository {
  export type Interface = IListModelsRepository;
}

export type AiModel = {
  providerId: string;
  providerName: string;
  modelId: string;
  modelName: string;
};

export interface IListModelsGateway {
  execute(): Promise<AiModel[]>;
}

export const ListModelsGateway = createAbstraction<IListModelsGateway>(
  "AiPowerUps/ListModelsGateway",
);
export namespace ListModelsGateway {
  export type Interface = IListModelsGateway;
}
