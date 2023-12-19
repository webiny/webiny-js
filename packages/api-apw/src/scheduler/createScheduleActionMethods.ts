/**
 * Package @commodo/fields does not have types.
 */
// @ts-expect-error
import { string, withFields } from "@commodo/fields";
import { validation } from "@webiny/validation";
import { mdbid } from "@webiny/utils";
import {
    ApwContentTypes,
    ApwScheduleAction,
    ApwScheduleActionCrud,
    ApwScheduleActionData,
    ApwScheduleActionTypes,
    CreateScheduleActionParams
} from "~/scheduler/types";

const CreateDataModel = withFields((instance: any) => {
    return {
        datetime: string({
            validation: validation.create(`required`)
        }),
        type: string({
            validation: validation.create(
                `required,in:${ApwContentTypes.PAGE}:${ApwContentTypes.CMS_ENTRY}`
            )
        }),
        action: string({
            validation: validation.create(
                `required,in:${ApwScheduleActionTypes.PUBLISH}:${ApwScheduleActionTypes.UNPUBLISH}`
            )
        }),
        entryId: string({
            validation: validation.create(`required`)
        }),
        modelId: string({
            validation: (value: string) => {
                if (instance.type !== ApwContentTypes.CMS_ENTRY) {
                    return true;
                } else if (!!value) {
                    return true;
                }
                throw new Error(
                    `There is no modelId defined when type is "${ApwContentTypes.CMS_ENTRY}"`
                );
            }
        })
    };
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

            const data: ApwScheduleActionData = await createDataModel.toJSON();

            const currentDateTime = new Date();
            const currentIdentity = getIdentity();

            const scheduleAction: ApwScheduleAction = {
                ...getTenantAndLocale(),
                data,
                id,
                createdOn: currentDateTime.toISOString(),
                modifiedOn: null,
                savedOn: currentDateTime.toISOString(),
                createdBy: {
                    id: currentIdentity.id,
                    type: currentIdentity.type,
                    displayName: currentIdentity.displayName
                },
                modifiedBy: null,
                savedBy: {
                    id: currentIdentity.id,
                    type: currentIdentity.type,
                    displayName: currentIdentity.displayName
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
