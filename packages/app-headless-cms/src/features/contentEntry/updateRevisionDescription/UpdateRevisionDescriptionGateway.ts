import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse, CmsModel } from "~/types.js";
import { EntryGraphQLFields } from "../abstractions.js";
import {
    UpdateRevisionDescriptionGateway as GatewayAbstraction,
    type IUpdateRevisionDescriptionParams
} from "./abstractions.js";

interface UpdateRevisionDescriptionResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

function createMutation(model: CmsModel, fields: EntryGraphQLFields.Interface) {
    return /* GraphQL */ `
        mutation CmsUpdate${model.singularApiName}RevisionDescription($revision: ID!, $revisionDescription: String!) {
            content: update${model.singularApiName}RevisionDescription(revision: $revision, revisionDescription: $revisionDescription) {
                data {
                    ${fields.getSystemFields(model)}
                    ${fields.getValuesBlock(model)}
                }
                error { message code data }
            }
        }`;
}

class UpdateRevisionDescriptionGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: CmsGraphQLClient.Interface,
        private fields: EntryGraphQLFields.Interface
    ) {}

    async execute({ model, id, revisionDescription }: IUpdateRevisionDescriptionParams) {
        const response = await this.client.execute<UpdateRevisionDescriptionResponse>({
            query: createMutation(model, this.fields),
            variables: { revision: id, revisionDescription }
        });

        const { data, error } = response.content;

        if (!data) {
            throw new Error(error?.message || "Could not update revision description");
        }

        return data;
    }
}

export const UpdateRevisionDescriptionGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateRevisionDescriptionGatewayImpl,
    dependencies: [CmsGraphQLClient, EntryGraphQLFields]
});
