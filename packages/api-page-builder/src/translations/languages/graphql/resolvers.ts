import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { Resolvers } from "@webiny/handler-graphql/types";
import { ListLanguagesRepository } from "~/translations/languages/repository/ListLanguagesRepository";
import { PbContext } from "~/graphql/types";
import { GqlLanguageMapper } from "~/translations/languages/graphql/GqlLanguageMapper";

export const languageResolvers: Resolvers<PbContext> = {
    TranslationsQuery: {
        listLanguages: async (_, __, context) => {
            try {
                const repository = new ListLanguagesRepository(context);
                const languages = await repository.execute();

                return new Response(languages.map(language => GqlLanguageMapper.toDTO(language)));
            } catch (err) {
                return new ErrorResponse(err);
            }
        }
    }
};
