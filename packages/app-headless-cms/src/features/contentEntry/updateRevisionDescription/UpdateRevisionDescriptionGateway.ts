import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse } from "~/types.js";
import { createUpdateRevisionDescriptionMutation } from "@webiny/app-headless-cms-common";
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

class UpdateRevisionDescriptionGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute({ model, id, revisionDescription }: IUpdateRevisionDescriptionParams) {
        const mutation = createUpdateRevisionDescriptionMutation(model);

        const response = await this.client.execute<UpdateRevisionDescriptionResponse>({
            query: mutation,
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
    dependencies: [CmsGraphQLClient]
});
