import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { FormBuilderStorageOperationsListSubmissionsParams } from "~/types";

type StandardSubmissionKey = keyof FormBuilderStorageOperationsListSubmissionsParams["where"];
type CmsEntryListWhereKey = keyof CmsEntryListWhere;

export class ListSubmissionsWhereProcessor {
    private readonly skipKeys = ["tenant", "locale", "formId"];
    private readonly keyMap: Partial<Record<StandardSubmissionKey, CmsEntryListWhereKey>> = {
        id_in: "entryId_in"
    };

    process(input: FormBuilderStorageOperationsListSubmissionsParams["where"]): CmsEntryListWhere {
        const where: CmsEntryListWhere = input.formId ? { form: { parent: input.formId } } : {};

        Object.keys(input)
            .filter(key => !this.skipKeys.includes(key))
            .forEach(key => {
                const remappedKey = this.keyMap[key as StandardSubmissionKey];
                const value = input[key as StandardSubmissionKey];

                if (remappedKey && value !== undefined) {
                    where[remappedKey] = value;
                } else if (value !== undefined) {
                    where[key] = value;
                }
            });

        return where;
    }
}
