import type { IDeployment, IDeployments } from "./types.js";

export interface IDeploymentsParams {
    deployments: IDeployment[];
}

export class Deployments implements IDeployments {
    private readonly deployments: IDeployment[];

    public constructor(params: IDeploymentsParams) {
        this.deployments = params.deployments;
    }

    public hasAny(): boolean {
        return this.deployments.length > 0;
    }

    public all(): IDeployment[] {
        return this.deployments;
    }

    public get(name: string): IDeployment | null {
        return this.deployments.find(deployment => deployment.name === name) || null;
    }

    public without(input: Pick<IDeployment, "name">): IDeployments {
        return createDeployments({
            deployments: this.deployments.filter(deployment => {
                return deployment.name !== input.name;
            })
        });
    }
}

export const createDeployments = (params: IDeploymentsParams): IDeployments => {
    return new Deployments(params);
};
