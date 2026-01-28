import { Result } from "webiny/api";
import { GetEntryUseCase, EntryId } from "webiny/api/cms/entry";
import { GetModelUseCase } from "webiny/api/cms/model";
import { Company, CompanyDto, CompanyValues } from "../../domain/Company.js";
import { COMPANY_MODEL_ID } from "../../domain/CompanyModel.js";
import { CompanyNotFoundError, CompanyPersistenceError } from "../../domain/errors.js";
import { GetCompanyByIdRepository as RepositoryAbstraction } from "./abstractions.js";

class GetCompanyByIdRepository implements RepositoryAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private getEntryUseCase: GetEntryUseCase.Interface
    ) {}

    async execute(id: string): Promise<Result<Company, RepositoryAbstraction.Error>> {
        try {
            const entryId = EntryId.from(id);

            // Get the company model
            const modelResult = await this.getModelUseCase.execute(COMPANY_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(
                    new CompanyPersistenceError(
                        new Error(`Model "${COMPANY_MODEL_ID}" was not found!`)
                    )
                );
            }

            // Get the company entry
            const entryResult = await this.getEntryUseCase.execute<CompanyValues>(
                modelResult.value,
                {
                    where: { entryId: entryId.id, latest: true }
                }
            );

            if (entryResult.isFail()) {
                return Result.fail(new CompanyNotFoundError(id));
            }

            const companyEntry = entryResult.value;

            const companyDto: CompanyDto = {
                id: companyEntry.entryId,
                values: companyEntry.values
            };

            return Result.ok(Company.from(companyDto));
        } catch (error) {
            return Result.fail(new CompanyPersistenceError(error as Error));
        }
    }
}

export default RepositoryAbstraction.createImplementation({
    implementation: GetCompanyByIdRepository,
    dependencies: [GetModelUseCase, GetEntryUseCase]
});
