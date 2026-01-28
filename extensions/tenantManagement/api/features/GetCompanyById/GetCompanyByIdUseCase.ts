import { Result } from "webiny/api";
import { Company, rootCompanyDto } from "../../domain/Company.js";
import {
    GetCompanyByIdUseCase as UseCaseAbstraction,
    GetCompanyByIdRepository
} from "./abstractions.js";

class GetCompanyByIdUseCase implements UseCaseAbstraction.Interface {
    constructor(private repository: GetCompanyByIdRepository.Interface) {}

    async execute(id: string): Promise<Result<Company, UseCaseAbstraction.Error>> {
        // Handle special root company case
        if (id === "root") {
            return Result.ok(Company.from(rootCompanyDto));
        }

        // Delegate to repository
        const result = await this.repository.execute(id);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: GetCompanyByIdUseCase,
    dependencies: [GetCompanyByIdRepository]
});
