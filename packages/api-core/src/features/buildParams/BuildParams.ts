import type { Container } from "@webiny/di";
import { BuildParam, BuildParams as BuildParamsAbstraction } from "./abstractions.js";

export class BuildParamsImpl implements BuildParamsAbstraction.Interface {
    constructor(private container: Container) {}

    get(key: string): string | null {
        const params = this.container.resolveAll<BuildParam.Interface>(BuildParam);
        const param = params.find(p => p.key === key);
        return param ? param.value : null;
    }
}
