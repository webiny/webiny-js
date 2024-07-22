import {
    IValidateImportFromUrlUseCase,
    IValidateImportFromUrlUseCaseExecuteParams,
    IValidateImportFromUrlUseCaseExecuteResult
} from "./abstractions/ValidateImportFromUrlUseCase";
import { getFilesFromData } from "~/crud/utils/getFilesFromData";
import { CmsImportExportFileType, ICmsImportExportFile } from "~/types";
import { NonEmptyArray } from "@webiny/api/types";
import { WebinyError } from "@webiny/error";
import { getImportExportFileType } from "~/tasks/utils/helpers/getImportExportFileType";

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
            files: files.reduce((collection, file) => {
                const result = getImportExportFileType(file.head);
                if (result.error) {
                    file.error = {
                        message: "File type not supported.",
                        data: {
                            type: result.type,
                            pathname: result.pathname
                        }
                    };
                    collection.push(file);
                    return collection;
                }

                collection.push(file);
                return collection;
            }, [] as unknown as NonEmptyArray<ICmsImportExportFile>)
        };
    }
}
