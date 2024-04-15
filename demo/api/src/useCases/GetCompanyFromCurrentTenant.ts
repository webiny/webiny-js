import { Company } from "@demo/shared";
import Error from "@webiny/error";
import { Context } from "../types";

export class GetCompanyFromCurrentTenant {
    private context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    async execute(): Promise<Company> {
        const tenant = this.context.requestedTenant;
        const companyModel = await this.getCompanyModel();

        const companyEntry = await this.context.cms.getEntry(companyModel, {
            where: { entryId: tenant.id, latest: true }
        });

        return companyEntry.values as Company;
    }

    private async getCompanyModel() {
        const companyModel = await this.context.cms.getModel("company");

        if (!companyModel) {
            throw new Error(`Model "company" was not found!`);
        }

        return companyModel;
    }
}
