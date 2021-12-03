import { ApwContext, ApwChangeRequestCrud } from "~/types";

export function createChangeRequestMethods(context: ApwContext): ApwChangeRequestCrud {
    return {
        async getModel() {
            return await context.cms.getModel("apwChangeRequestModelDefinition");
        },
        async get(id) {
            const model = await this.getModel();
            return await context.cms.getEntry(model, {
                where: {
                    id
                }
            });
        },
        async list(params) {
            const model = await this.getModel();
            return await context.cms.listEntries(model, params);
        },
        async create(data) {
            const model = await this.getModel();
            return await context.cms.createEntry(model, data);
        },
        async update(id, data) {
            const model = await this.getModel();
            /**
             * We're fetching the existing entry here because we're not accepting "app" field as input,
             * but, we still need to retain its value after the "update" operation.
             */
            const existingEntry = await this.get(id);

            return await context.cms.updateEntry(model, id, {
                ...existingEntry.values,
                ...data
            });
        },
        async delete(id: string) {
            const model = await this.getModel();
            await context.cms.deleteEntry(model, id);
            return true;
        }
    };
}
