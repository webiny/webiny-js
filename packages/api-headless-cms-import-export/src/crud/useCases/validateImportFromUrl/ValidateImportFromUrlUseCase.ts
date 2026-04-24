import type {
    IValidateImportFromUrlUseCase,
    IValidateImportFromUrlUseCaseExecuteParams,
    IValidateImportFromUrlUseCaseExecuteResult
} from "./abstractions/ValidateImportFromUrlUseCase.js";
import { CmsImportExportFileType } from "~/types.js";
import type { ICmsImportExportFile } from "~/types.js";
import type { NonEmptyArray } from "@webiny/api/types.js";
import { WebinyError } from "@webiny/error";
import { getImportExportFileType } from "~/tasks/utils/helpers/getImportExportFileType.js";
import { parseImportUrlData } from "~/crud/utils/parseImportUrlData.js";
import type { CmsModel, HeadlessCms } from "@webiny/api-headless-cms/types/index.js";
import { makeSureModelsAreIdentical } from "~/crud/utils/makeSureModelsAreIdentical.js";
import { ModelToAstConverter } from "@webiny/api-headless-cms/features/contentModel/ModelToAstConverter/index.js";

export interface IValidateImportFromUrlUseCaseParams {
    getModel: HeadlessCms["getModel"];
    modelToAstConverter: ModelToAstConverter.Interface;
}

export class ValidateImportFromUrlUseCase implements IValidateImportFromUrlUseCase {
    private readonly getModel: HeadlessCms["getModel"];
    private readonly modelToAstConverter: ModelToAstConverter.Interface;

    public constructor(params: IValidateImportFromUrlUseCaseParams) {
        this.getModel = params.getModel;
        this.modelToAstConverter = params.modelToAstConverter;
    }

    public async execute(
        params: IValidateImportFromUrlUseCaseExecuteParams
    ): Promise<IValidateImportFromUrlUseCaseExecuteResult> {
        const { data } = params;

        const { model: validatedModel, files } = parseImportUrlData(data);
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

        let model: CmsModel;
        try {
            model = await this.getModel(validatedModel.modelId);
        } catch (ex) {
            if (ex.code !== "NOT_FOUND") {
                throw ex;
            }
            throw new WebinyError(
                `Model provided in the JSON data, "${validatedModel.modelId}", not found.`,
                "MODEL_NOT_FOUND",
                {
                    modelId: validatedModel.modelId
                }
            );
        }

        makeSureModelsAreIdentical({
            modelToAstConverter: this.modelToAstConverter,
            model,
            target: validatedModel
        });

        return {
            model,
            files: files.reduce(
                (collection, file) => {
                    const result = getImportExportFileType(file.head);
                    if (result.error) {
                        file.error = {
                            message: "File type not supported.",
                            code: "FILE_TYPE_NOT_SUPPORTED",
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
                },
                [] as unknown as NonEmptyArray<ICmsImportExportFile>
            )
        };
    }
}
