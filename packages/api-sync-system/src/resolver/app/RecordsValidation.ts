import type { SQSRecord } from "@webiny/aws-sdk/types/index.js";
import type {
    IRecordsValidation,
    IRecordsValidationResult
} from "./abstractions/RecordsValidation.js";
import { createZodError } from "@webiny/utils";
import { createEventValidation } from "~/resolver/app/validation/event.js";

const validation = createEventValidation();

export class RecordsValidation implements IRecordsValidation {
    public async validate(records: SQSRecord[]): Promise<IRecordsValidationResult> {
        const result = await validation.safeParseAsync(records);
        if (result.error) {
            return {
                error: createZodError(result.error)
            };
        }
        return {
            records: result.data
        };
    }
}

export const createRecordsValidation = (): IRecordsValidation => {
    return new RecordsValidation();
};
