import { Company, Identity } from "@demo/shared";
import { parseIdentifier } from "@webiny/utils";
import { Context } from "../types";
import { IListArticlesUseCase, ListArticlesParams, ListArticlesReturn } from "./ListArticles";
import { GetEmployeeFromIdentity } from "./GetEmployeeFromIdentity";
import { GetCompanyById } from "./GetCompanyById";
import { GetCompanyFromCurrentTenant } from "./GetCompanyFromCurrentTenant";

const getEntryId = (id: string) => {
    const { id: entryId } = parseIdentifier(id);
    return entryId;
};

export class ContextualArticlesFiltering implements IListArticlesUseCase {
    private readonly context: Context;
    private listArticles: IListArticlesUseCase;

    constructor(context: Context, listArticles: IListArticlesUseCase) {
        this.context = context;
        this.listArticles = listArticles;
    }

    async execute(params: ListArticlesParams): Promise<ListArticlesReturn> {
        const identity = this.context.security.getIdentity();

        let company: Company;

        if (identity.type === Identity.Employee) {
            const getEmployee = new GetEmployeeFromIdentity(this.context);
            const employee = await getEmployee.execute();
            const getCompany = new GetCompanyById(this.context);
            company = await getCompany.execute(getEntryId(employee.company.id));
        } else {
            const getCompany = new GetCompanyFromCurrentTenant(this.context);
            company = await getCompany.execute();
        }

        const where = this.applyFilter(company, params.where || {});

        return this.listArticles.execute({ ...params, where });
    }

    private applyFilter(company: Company, where: Record<string, any>) {
        return {
            ...where,
            AND: [
                ...(where.AND || []),
                {
                    companyExclusionList: {
                        entryId_not: company.id
                    },
                    cultureGroups: {
                        entryId_in: company.contentSettings.cultureGroups.map(cg =>
                            getEntryId(cg.id)
                        )
                    },
                    region: {
                        entryId_in: company.contentSettings.contentRegions.map(cg =>
                            getEntryId(cg.id)
                        )
                    }
                }
            ]
        };
    }
}
