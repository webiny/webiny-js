import { makeAutoObservable } from "mobx";
import { ColumnDTO } from "./Column";
import { IColumnsRepository } from "./IColumnsRepository";
import { IColumnsVisibilityRepository } from "./IColumnsVisibilityRepository";

export class ColumnsVisibilityDecorator implements IColumnsRepository {
    private columnsVisibilityRepository: IColumnsVisibilityRepository;
    private columnsRepository: IColumnsRepository;

    constructor(
        visibilityStorage: IColumnsVisibilityRepository,
        columnsRepository: IColumnsRepository
    ) {
        this.columnsVisibilityRepository = visibilityStorage;
        this.columnsRepository = columnsRepository;
        makeAutoObservable(this);
    }

    get() {
        const columns = this.columnsRepository.get();
        const visibility = this.columnsVisibilityRepository.get();

        if (visibility) {
            return columns.map(column => {
                return { ...column, visible: visibility[column.name] ?? column.visible };
            });
        }

        return columns;
    }

    async update(column: ColumnDTO) {
        await this.columnsRepository.update(column);

        const visibility = this.columnsVisibilityRepository.get() || {};
        await this.columnsVisibilityRepository.update({
            ...visibility,
            [column.name]: column.visible
        });
    }
}
