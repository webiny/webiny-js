import { ListLanguagesGateway as GatewayAbstraction, LanguageDto } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

const LIST_LANGUAGES = /* GraphQL */ `
    query ListLanguages {
        languages {
            listLanguages {
                data {
                    id
                    code
                    name
                    direction
                    isDefault
                    enabled
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

type ListLanguagesResponse = {
    languages: {
        listLanguages:
            | { data: LanguageDto[]; error: null }
            | { data: null; error: { code: string; message: string } };
    };
};

class ListLanguagesGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<LanguageDto[]> {
        const response = await this.client.execute<ListLanguagesResponse>({
            query: LIST_LANGUAGES
        });

        const envelope = response.languages.listLanguages;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data;
    }
}

export const ListLanguagesGateway = GatewayAbstraction.createImplementation({
    implementation: ListLanguagesGatewayImpl,
    dependencies: [MainGraphQLClient]
});
