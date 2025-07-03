import { IGetPageModelGateway } from "./IGetPageModelGateway.js";
import { GetPageModelRepository } from "./GetPageModelRepository.js";
import { GetPageModelUseCase } from "./GetPageModelUseCase.js";
import { IGetPageModelUseCase } from "./IGetPageModelUseCase.js";
import { IGetPageModelRepository } from "./IGetPageModelRepository.js";

interface IGetPageModelInstance {
    useCase: IGetPageModelUseCase;
    repository: IGetPageModelRepository;
}

export class GetPageModel {
    public static getInstance(gateway: IGetPageModelGateway): IGetPageModelInstance {
        const repository = new GetPageModelRepository(gateway);
        const useCase = new GetPageModelUseCase(repository);

        return {
            useCase,
            repository
        };
    }
}
