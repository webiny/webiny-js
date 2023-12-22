import { makeAutoObservable, runInAction } from "mobx";
import { IColumnsVisibilityGateway } from "../gateways/IColumnsVisibilityGateway";
import { IColumnsVisibilityRepository } from "./IColumnsVisibilityRepository";

export class ColumnsVisibilityRepository implements IColumnsVisibilityRepository {
    private gateway: IColumnsVisibilityGateway;
    private state: Record<string, boolean> | undefined;

    constructor(gateway: IColumnsVisibilityGateway) {
        this.gateway = gateway;
        this.state = this.gateway.get();
        makeAutoObservable(this);
    }

    get() {
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
