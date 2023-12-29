import { makeAutoObservable } from "mobx";
import { IColumnsVisibilityRepository } from "./IColumnsVisibilityRepository";
import { IColumnsRepository } from "../Columns";

export class ColumnsVisibilityDecorator implements IColumnsRepository {
    private columnsVisibilityRepository: IColumnsVisibilityRepository;
    private columnsRepository: IColumnsRepository;

    constructor(
        visibilityRepository: IColumnsVisibilityRepository,
        columnsRepository: IColumnsRepository
    ) {
        this.columnsRepository = columnsRepository;
        this.columnsVisibilityRepository = visibilityRepository;
        makeAutoObservable(this);
    }

    async init() {
        this.columnsRepository.init();
        this.columnsVisibilityRepository.init();
    }

    getColumns() {
        const columns = this.columnsRepository.getColumns();
        const visibility = this.columnsVisibilityRepository.getVisibility();

        return visibility
            ? columns.map(column => {
                  return { ...column, visible: visibility[column.name] ?? column.visible };
              })
            : columns;
    }
}
