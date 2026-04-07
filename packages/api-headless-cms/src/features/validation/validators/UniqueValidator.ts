import WebinyError from "@webiny/error";
import { CmsModelFieldValidator } from "../abstractions/CmsModelFieldValidator.js";
import type { CmsModelFieldValidatorValidateParams } from "~/types/types.js";
import { ListLatestEntriesUseCase } from "~/features/contentEntry/ListEntries/index.js";

class UniqueValidatorImpl implements CmsModelFieldValidator.Interface {
    public readonly name = "unique";

    public async validate({
        field,
        value: initialValue,
        context,
        model,
        entry
    }: CmsModelFieldValidatorValidateParams): Promise<boolean> {
        const value = (initialValue || "").trim();
        if (!value) {
            return true;
        }
        try {
            const listLatest = context.container.resolve(ListLatestEntriesUseCase);

            const listResult = await listLatest.execute(model, {
                where: {
                    entryId_not: entry ? entry.entryId : undefined,
                    values: {
                        [field.fieldId]: value
                    }
                },
                limit: 1
            });
            if (listResult.isFail()) {
                throw listResult.error;
            }

            return listResult.value.entries.length === 0;
        } catch (ex) {
            throw new WebinyError(
                "Error while checking if the field value is unique.",
                "UNIQUE_CHECK_ERROR",
                {
                    error: ex,
                    field,
                    value,
                    model
                }
            );
        }
    }
}

export const UniqueValidator = CmsModelFieldValidator.createImplementation({
    implementation: UniqueValidatorImpl,
    dependencies: []
});
