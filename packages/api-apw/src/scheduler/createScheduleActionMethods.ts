/**
 * Package mdbid does not have types.
 */
// @ts-ignore
import mdbid from "mdbid";
/**
 * Package @commodo/fields does not have types.
 */
// @ts-ignore
import { string, withFields } from "@commodo/fields";
import { validation } from "@webiny/validation";
import {
    ApwScheduleActionCrud,
    ApwScheduleActionData,
    CreateScheduleActionParams
} from "~/scheduler/types";

const CreateDataModel = withFields({
    datetime: string({
        validation: validation.create(`required`)
    }),
    type: string({
        validation: validation.create(`required,in:page:cms_entry`)
    }),
    action: string({
        validation: validation.create(`required,in:publish:unpublish`)
    }),
    entryId: string({
        validation: validation.create(`required`)
    })
})();

interface GetTenantAndLocaleResult {
    tenant: string;
    locale: string;
}

export function createScheduleActionMethods({
    storageOperations,
    getIdentity,
    getTenant,
    getLocale
}: CreateScheduleActionParams): ApwScheduleActionCrud {
    const getTenantAndLocale = (): GetTenantAndLocaleResult => {
        const tenant = getTenant().id;
        const locale = getLocale().code;
        return {
            tenant,
            locale
        };
    };
    return {
        async get(id) {
            return storageOperations.get({
                where: {
                    id,
                    ...getTenantAndLocale()
                }
            });
        },
        async list(params) {
            return storageOperations.list({
                ...params,
                where: {
                    ...params.where,
                    ...getTenantAndLocale()
                }
            });
        },
        async create(input) {
            const createDataModel = new CreateDataModel().populate(input);

            await createDataModel.validate();

            const id: string = mdbid();
            const identity = getIdentity();

            const data: ApwScheduleActionData = await createDataModel.toJSON();

            const scheduleAction = {
                ...getTenantAndLocale(),
                data,
                id,
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    type: identity.type,
                    displayName: identity.displayName
                }
            };

            return await storageOperations.create({
                item: scheduleAction,
                input
            });
        },
        async update(id, data) {
            const updateDataModel = new CreateDataModel().populate(data);

            await updateDataModel.validate();

            const original = await this.get(id);

            if (!original) {
                throw new Error("Not found!");
            }

            return await storageOperations.update({ item: original, input: data });
        },
        async delete(id: string) {
            await storageOperations.delete({ id, ...getTenantAndLocale() });

            return true;
        },
        async getCurrentTask() {
            return await storageOperations.getCurrentTask({ where: { ...getTenantAndLocale() } });
        },
        async updateCurrentTask(item) {
            return await storageOperations.updateCurrentTask({ item });
        },
        async deleteCurrentTask() {
            return await storageOperations.deleteCurrentTask({ ...getTenantAndLocale() });
        }
    };
}
