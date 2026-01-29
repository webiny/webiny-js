import { BuildParam, BuildParams as BuildParamsAbstraction } from "./abstractions.js";

export class BuildParamsImpl implements BuildParamsAbstraction.Interface {
    constructor(private params: BuildParam.Interface[]) {}

    get<T = any>(key: string): T | null {
        const param = this.params.find(p => p.key === key);
        return param ? param.value : null;
    }
}

export const BuildParams = BuildParamsAbstraction.createImplementation({
    implementation: BuildParamsImpl,
    dependencies: [[BuildParam, { multiple: true }]]
});
