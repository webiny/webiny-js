import Error from "@webiny/error";
import { Context } from "../types";
import { Employee } from "@demo/shared";

export class GetEmployeeFromIdentity {
    private context: Context;
    constructor(context: Context) {
        this.context = context;
    }

    async execute(): Promise<Employee> {
        const identity = this.context.security.getIdentity();
        const employeeModel = await this.getEmployeeModel();

        const employeeEntry = await this.context.cms.getEntry(employeeModel, {
            where: { entryId: identity.id, latest: true }
        });

        return { id: employeeEntry.entryId, ...employeeEntry.values } as Employee;
    }

    private async getEmployeeModel() {
        const model = await this.context.cms.getModel("employee");

        if (!model) {
            throw new Error(`Model "employee" was not found!`);
        }

        return model;
    }
}
