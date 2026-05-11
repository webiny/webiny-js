import { UpdatePageRevisionDescriptionGateway as GatewayAbstraction } from "./abstractions.js";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { getPageGraphQLFields } from "~/features/pages/shared/pageGraphQLFields.js";

const UPDATE_PAGE_REVISION_DESCRIPTION = /* GraphQL */ `
    mutation UpdatePageRevisionDescription($id: ID!, $revisionDescription: String) {
        websiteBuilder {
            updatePageRevisionDescription(id: $id, revisionDescription: $revisionDescription) {
                data {
                    ${getPageGraphQLFields(["properties", "metadata"]).join("\n")}
                }
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;

interface UpdatePageRevisionDescriptionVariables {
    id: string;
    revisionDescription: string | undefined;
}

type UpdatePageRevisionDescriptionResponse = {
    websiteBuilder: {
        updatePageRevisionDescription:
            | { data: PageGatewayDto; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class UpdatePageRevisionDescriptionGatewayImpl implements GatewayAbstraction.Interface {
    public constructor(private readonly client: MainGraphQLClient.Interface) {}

    public async execute(
        id: string,
        revisionDescription: string | undefined
    ): Promise<PageGatewayDto> {
        const response = await this.client.execute<
            UpdatePageRevisionDescriptionResponse,
            UpdatePageRevisionDescriptionVariables
        >({
            query: UPDATE_PAGE_REVISION_DESCRIPTION,
            variables: {
                id,
                revisionDescription
            }
        });

        const envelope = response.websiteBuilder.updatePageRevisionDescription;
        if (envelope.error) {
            throw new Error(
                envelope.error.message || "Could not update page revision description."
            );
        }

        return envelope.data;
    }
}

export const UpdatePageRevisionDescriptionGateway = GatewayAbstraction.createImplementation({
    implementation: UpdatePageRevisionDescriptionGatewayImpl,
    dependencies: [MainGraphQLClient]
});
