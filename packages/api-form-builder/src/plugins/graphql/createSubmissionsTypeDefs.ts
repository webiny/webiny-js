import { CmsFieldTypePlugins, CmsModel } from "@webiny/api-headless-cms/types";
import { renderFields } from "@webiny/api-headless-cms/utils/renderFields";
import { renderSortEnum } from "@webiny/api-headless-cms/utils/renderSortEnum";

export interface CreateSubmissionsTypeDefsParams {
    model: CmsModel;
    models: CmsModel[];
    plugins: CmsFieldTypePlugins;
}

export const createSubmissionsTypeDefs = (params: CreateSubmissionsTypeDefsParams): string => {
    const { model, models, plugins: fieldTypePlugins } = params;
    const { fields } = model;

    const fieldTypes = renderFields({
        models,
        model,
        fields,
        type: "manage",
        fieldTypePlugins
    });

    const sortEnumRender = renderSortEnum({
        model,
        fields: model.fields,
        fieldTypePlugins,
        sorterPlugins: []
    });

    return /* GraphQL */ `
        ${fieldTypes.map(f => f.typeDefs).join("\n")}

        type FbFormSubmission {
            id: ID!
            savedOn: DateTime!
            createdOn: DateTime!
            createdBy: FmCreatedBy!
            ${fieldTypes.map(f => f.fields).join("\n")}
        }

        enum FbSubmissionSort {
            ${sortEnumRender}
        }

        type FbFormSubmissionResponse {
            data: FbFormSubmission
            error: FbError
        }

        type FbListSubmissionsMeta {
            cursor: String
            hasMoreItems: Boolean
            totalCount: Int
        }

        type FbFormSubmissionsListResponse {
            data: [FbFormSubmission]
            meta: FbListSubmissionsMeta
            error: FbError
        }

        type FbExportFormSubmissionsFile {
            src: String
            key: String
        }

        type FbExportFormSubmissionsResponse {
            data: FbExportFormSubmissionsFile
            error: FbError
        }

        extend type FbQuery {
            # List form submissions for specific Form
            listFormSubmissions(
                form: ID!
                sort: [FbSubmissionSort!]
                limit: Int
                after: String
            ): FbFormSubmissionsListResponse
        }

        extend type FbMutation {
            # Submits a form
            createFormSubmission(
                revision: ID!
                data: JSON!
                reCaptchaResponseToken: String
                meta: JSON
            ): FbFormSubmissionResponse

            # Export submissions as a CSV file
            exportFormSubmissions(form: ID!): FbExportFormSubmissionsResponse
        }
    `;
};
