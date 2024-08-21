import { ErrorResponse, createGraphQLSchemaPlugin, Response } from "@webiny/handler-graphql";
import { PbContext } from "~/graphql/types";
import { SaveTranslatableCollection } from "~/translations/useCases/SaveTranslatableCollection";
import { TranslatableItemDTO } from "~/translations/types";
import { schema } from "~/translations/schema";
import { ListLanguagesRepository } from "~/translations/Languages/repository/ListLanguagesRepository";

interface UpdateTranslatableCollectionParams {
    collectionId: string;
    items: TranslatableItemDTO[];
}

export const createTranslations = () => {
    return [
        createGraphQLSchemaPlugin<PbContext>({
            typeDefs: schema,
            resolvers: {
                Query: {
                    translations: () => ({})
                },
                Mutation: {
                    translations: () => ({})
                },
                TranslationsQuery: {
                    listLanguages: async (_, __, context) => {
                        try {
                            const repository = new ListLanguagesRepository(context);
                            const languages = await repository.execute();

                            return new Response(languages);
                        } catch (err) {
                            return new ErrorResponse(err);
                        }
                    }
                },
                TranslationsMutation: {
                    updateTranslatableCollection: async (_, args, context) => {
                        const { collectionId, items } = args as UpdateTranslatableCollectionParams;

                        try {
                            const useCase = new SaveTranslatableCollection(context);
                            await useCase.execute(collectionId, items);

                            return new Response(true);
                        } catch (err) {
                            return new ErrorResponse(err);
                        }
                    }
                }
            }
        })
    ];
};
