import { Result } from "webiny/api";
import { Company } from "../../domain/Company.js";
import {
    UpdateCompanyUseCase as UseCaseAbstraction,
    UpdateCompanyRepository,
    UpdateCompanyInput
} from "./abstractions.js";

class UpdateCompanyUseCase implements UseCaseAbstraction.Interface {
    constructor(private repository: UpdateCompanyRepository.Interface) {}

    async execute(
        id: string,
        input: UpdateCompanyInput
    ): Promise<Result<Company, UseCaseAbstraction.Error>> {
        // Delegate to repository
        const result = await this.repository.execute(id, input);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: UpdateCompanyUseCase,
    dependencies: [UpdateCompanyRepository]
});
