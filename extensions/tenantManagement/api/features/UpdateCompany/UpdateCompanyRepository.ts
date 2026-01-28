import { Result } from "webiny/api";
import { EntryId } from "webiny/api/cms/entry";
import { GetEntryUseCase, UpdateEntryUseCase } from "webiny/api/cms/entry";
import { GetModelUseCase } from "webiny/api/cms/model";
import { Company, CompanyDto } from "../../domain/Company.js";
import { COMPANY_MODEL_ID } from "../../domain/CompanyModel.js";
import { CompanyNotFoundError, CompanyPersistenceError } from "../../domain/errors.js";
import {
    UpdateCompanyRepository as RepositoryAbstraction,
    UpdateCompanyInput
} from "./abstractions.js";

class UpdateCompanyRepository implements RepositoryAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private getEntryUseCase: GetEntryUseCase.Interface,
        private updateEntryUseCase: UpdateEntryUseCase.Interface
    ) {}

    async execute(
        id: string,
        input: UpdateCompanyInput
    ): Promise<Result<Company, RepositoryAbstraction.Error>> {
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

            // Get the current company entry to merge with updates
            const getEntryResult = await this.getEntryUseCase.execute<Omit<CompanyDto, "id">>(
                modelResult.value,
                {
                    where: { entryId: entryId.id, latest: true }
                }
            );

            if (getEntryResult.isFail()) {
                return Result.fail(new CompanyNotFoundError(id));
            }

            const updateResult = await this.updateEntryUseCase.execute(
                modelResult.value,
                entryId.toString(),
                {
                    values: input
                }
            );

            if (updateResult.isFail()) {
                return Result.fail(new CompanyPersistenceError(updateResult.error));
            }

            const updatedEntry = updateResult.value;

            const companyDto: CompanyDto = {
                id: updatedEntry.entryId,
                ...updatedEntry.values
            } as CompanyDto;

            return Result.ok(Company.from(companyDto));
        } catch (error) {
            return Result.fail(new CompanyPersistenceError(error));
        }
    }
}

export default RepositoryAbstraction.createImplementation({
    implementation: UpdateCompanyRepository,
    dependencies: [GetModelUseCase, GetEntryUseCase, UpdateEntryUseCase]
});
