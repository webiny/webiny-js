import { makeAutoObservable, runInAction } from "mobx";
import { IColumnsVisibilityGateway } from "../gateways/IColumnsVisibilityGateway";
import { IColumnsVisibilityRepository } from "./IColumnsVisibilityRepository";

export class ColumnsVisibilityRepository implements IColumnsVisibilityRepository {
    private gateway: IColumnsVisibilityGateway;
    private state: Record<string, boolean>;

    constructor(gateway: IColumnsVisibilityGateway) {
        this.gateway = gateway;
        this.state = {};
        makeAutoObservable(this);
    }

    async init() {
        const visibility = await this.gateway.get();
        runInAction(() => {
            this.state = visibility ?? {};
        });
    }

    getVisibility() {
        return this.state;
    }

    async update(value: Record<string, boolean>) {
        const newState = {
            ...this.state,
            ...value
        };

        await this.gateway.set(newState);

        runInAction(() => {
            this.state = newState;
        });
    }
}
