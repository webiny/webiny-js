import { ErrorResponse, createGraphQLSchemaPlugin, Response } from "@webiny/handler-graphql";
import { schema } from "~/translations/schema/schema";
import { PbContext } from "~/graphql/types";
import { ListLanguages } from "~/translations/useCases/ListLanguages";

export const createTranslations = () => {
    return [
        createGraphQLSchemaPlugin<PbContext>({
            typeDefs: schema,
            resolvers: {
                Query: {
                    translations: () => ({})
                },
                TranslationsQuery: {
                    listLanguages: async (_, args, context) => {
                        try {
                            const useCase = new ListLanguages(context);
                            const languages = await useCase.execute();

                            return new Response(languages);
                        } catch (err) {
                            return new ErrorResponse(err);
                        }
                    }
                }
            }
        })
    ];
};
