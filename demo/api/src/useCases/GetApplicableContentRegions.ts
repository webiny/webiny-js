import Error from "@webiny/error";
import { Context } from "../types";
import { GetEmployeeFromIdentity } from "./GetEmployeeFromIdentity";
import { getEntryId } from "../getEntryId";
import { CmsSchemaClient } from "../CmsSchemaClient";
import { ContentRegion } from "@demo/shared";

export type ApplicableContentRegions = Array<ContentRegion>;

type GetCompanyRegions = {
    getCompany: {
        data: {
            contentSettings: {
                contentRegions: ApplicableContentRegions;
            };
        };
        error: {
            code: string;
            message: string;
            data: Record<string, any>;
        };
    };
};

export interface IGetApplicableContentRegions {
    execute(): Promise<ApplicableContentRegions>;
}

export class GetApplicableContentRegions implements IGetApplicableContentRegions {
    private readonly context: Context;
    constructor(context: Context) {
        this.context = context;
    }

    async execute() {
        const getEmployee = new GetEmployeeFromIdentity(this.context);
        const employee = await getEmployee.execute();
        const cmsClient = new CmsSchemaClient(this.context);

        const { data } = await cmsClient.preview<GetCompanyRegions>({
            query: GET_COMPANY_REGIONS,
            operationName: "GetCompanyRegions",
            variables: {
                id: getEntryId(employee.company.id)
            }
        });

        if (data.getCompany.error) {
            throw new Error(data?.getCompany.error);
        }

        return data.getCompany.data.contentSettings.contentRegions;
    }
}

const GET_COMPANY_REGIONS = /* GraphQL */ `
    query GetCompanyRegions($id: String) {
        getCompany(where: { entryId: $id }) {
            data {
                contentSettings {
                    contentRegions {
                        id: entryId
                        title
                        slug
                        languages {
                            id: entryId
                            name
                            slug
                        }
                    }
                }
            }
            error {
                code
                message
                data
            }
        }
    }
`;
