import type { FmFile } from "../shared/types.js";
import {
    GetFileRepository as RepositoryAbstraction,
    GetFileGateway,
    type GetFileGatewayParams
} from "./abstractions.js";

class GetFileRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: GetFileGateway.Interface) {}

    async execute(params: GetFileGatewayParams): Promise<FmFile> {
        return this.gateway.execute(params);
    }
}

export const GetFileRepository = RepositoryAbstraction.createImplementation({
    implementation: GetFileRepositoryImpl,
    dependencies: [GetFileGateway]
});
