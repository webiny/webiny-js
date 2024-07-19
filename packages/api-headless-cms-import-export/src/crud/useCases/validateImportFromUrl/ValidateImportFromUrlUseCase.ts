import {
    IValidateImportFromUrlUseCase,
    IValidateImportFromUrlUseCaseExecuteParams,
    IValidateImportFromUrlUseCaseExecuteResult
} from "./abstractions/ValidateImportFromUrlUseCase";
import { getFilesFromData } from "~/crud/utils/getFilesFromData";
import { CmsImportExportFileType, ICmsImportExportFile } from "~/types";
import { NonEmptyArray } from "@webiny/api/types";
import { WebinyError } from "@webiny/error";

export class ValidateImportFromUrlUseCase implements IValidateImportFromUrlUseCase {
    public async execute(
        params: IValidateImportFromUrlUseCaseExecuteParams
    ): Promise<IValidateImportFromUrlUseCaseExecuteResult> {
        const { data } = params;
        const files = getFilesFromData(data);
        /**
         * There must be at least one file in the data.
         */
        if (files.length === 0) {
            throw new WebinyError("No files found in the provided data.", "NO_FILES_FOUND");
        }
        /**
         * Next step of the validation is to verify that, at least, one entries type file exists in the data.
         */
        const entries = files.find(file => {
            return file.type === CmsImportExportFileType.ENTRIES;
        });
        if (!entries) {
            throw new WebinyError("No entries file found in the provided data.", "NO_ENTRIES_FILE");
        }

        return {
            files: files as NonEmptyArray<ICmsImportExportFile>
        };
    }
}
