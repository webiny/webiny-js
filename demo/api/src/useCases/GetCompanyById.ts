import { Company } from "@demo/shared";
import Error from "@webiny/error";
import { Context } from "../types";

export class GetCompanyById {
    private context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    async execute(id: string): Promise<Company> {
        return this.context.tenancy.withRootTenant(async () => {
            const companyModel = await this.getCompanyModel();

            const companyEntry = await this.context.cms.getEntry(companyModel, {
                where: { entryId: id, latest: true }
            });

            return { id, ...companyEntry.values } as Company;
        });
    }

    private async getCompanyModel() {
        const model = await this.context.cms.getModel("company");

        if (!model) {
            throw new Error(`Model "company" was not found!`);
        }

        return model;
    }
}
