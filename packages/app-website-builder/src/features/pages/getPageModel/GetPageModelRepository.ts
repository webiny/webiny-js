import { makeAutoObservable, runInAction } from "mobx";
import { IGetPageModelRepository } from "./IGetPageModelRepository.js";
import { IGetPageModelGateway } from "./IGetPageModelGateway.js";
import { PageModelDto } from "./PageModelDto.js";

export class GetPageModelRepository implements IGetPageModelRepository {
    private model: PageModelDto | undefined;
    private gateway: IGetPageModelGateway;

    constructor(gateway: IGetPageModelGateway) {
        this.gateway = gateway;
        this.model = undefined;
        makeAutoObservable(this);
    }

    async load() {
        if (!this.hasModel()) {
            const model = await this.gateway.execute();
            runInAction(() => {
                this.model = model;
            });
        }
    }

    getModel() {
        return this.model;
    }

    hasModel() {
        return Boolean(this.model);
    }
}
