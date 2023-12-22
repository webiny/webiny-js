import { IColumnsVisibilityRepository } from "./domain/IColumnsVisibilityRepository";
import { IColumnsVisibilityUpdater } from "./domain/IColumnsVisibilityUpdater";

export class ColumnsVisibilityUpdater implements IColumnsVisibilityUpdater {
    private repository: IColumnsVisibilityRepository;

    constructor(repository: IColumnsVisibilityRepository) {
        this.repository = repository;
    }

    public async update(value: Record<string, boolean>) {
        await this.repository.update(value);
    }
}
