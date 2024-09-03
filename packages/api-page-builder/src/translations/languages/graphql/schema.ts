export const languageSchema = /* GraphQL */ `
    type Language {
        name: String!
        code: String!
        direction: String!
        isBaseLanguage: Boolean!
    }

    type TranslationLanguagesResponse {
        data: [Language!]
        error: CmsError
    }

    extend type TranslationsQuery {
        listLanguages: TranslationLanguagesResponse
    }
`;
