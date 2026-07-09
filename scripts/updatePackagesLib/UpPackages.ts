import type { IVersionedPackage } from "./types";
import { execa } from "execa";

export interface IUpPackagesParamsOptions {
    useCaret: boolean;
}

export interface IUpPackagesParams {
    packages: IVersionedPackage[];
    options: IUpPackagesParamsOptions;
}

export class UpPackages {
    private readonly packages: IVersionedPackage[];
    private readonly options: IUpPackagesParamsOptions;

    private constructor(params: IUpPackagesParams) {
        this.packages = params.packages;
        this.options = params.options;
    }

    public static async create(params: IUpPackagesParams): Promise<UpPackages> {
        return new UpPackages(params);
    }

    public async process(): Promise<void> {
        const packages = this.packages.map(
            pkg => `${pkg.name}@${this.options.useCaret ? "^" : ""}${pkg.latestVersion.raw}`
        );
        await execa("yarn", ["up", ...packages]);
    }
}
