import WebinyError from "@webiny/error";
import { SqlEntryFilter as SqlEntryFilterAbstraction } from "../abstractions/index.js";

class RefFilterImpl implements SqlEntryFilterAbstraction.Interface {
    public readonly fieldType = "ref";

    public exec(params: SqlEntryFilterAbstraction.ExecParams): void {
        throw new WebinyError(
            `Filtering by ref field "${params.field.fieldId}" is not yet supported in SQL storage. Ref fields are stored as JSON and require dedicated index columns.`,
            "REF_FILTER_NOT_SUPPORTED",
            { fieldId: params.field.fieldId }
        );
    }
}

export const RefFilter = SqlEntryFilterAbstraction.createImplementation({
    implementation: RefFilterImpl,
    dependencies: []
});
