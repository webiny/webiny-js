import type ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { WebinyError } from "@webiny/error";
import { TranslatedCollectionInputDto } from "~/translations/translatedCollection/saveTranslatedCollection/TranslatedCollectionInputDto";
import { ISaveTranslatedCollectionGateway } from "~/translations/translatedCollection/saveTranslatedCollection/ISaveTranslatedCollectionGateway";
import { TranslatedCollectionDto } from "~/translations/translatedCollection/getTranslatedCollection/TranslatedCollectionDto";
import { GenericRecord } from "@webiny/app/types";

const MUTATION = gql`
    mutation SaveTranslatedCollection(
        $collectionId: ID!
        $languageCode: String!
        $items: [TranslatedItemInput!]!
    ) {
        translations {
            saveTranslatedCollection(
                collectionId: $collectionId
                languageCode: $languageCode
                items: $items
            ) {
                data {
                    collectionId
                    languageCode
                    items {
                        itemId
                        baseValue
                        baseValueModifiedOn
                        value
                        context
                        translatedOn
                        translatedBy {
                            id
                            displayName
                        }
                    }
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

interface MutationType {
    translations: {
        saveTranslatedCollection:
            | {
                  data: TranslatedCollectionDto;
                  error: undefined;
              }
            | {
                  data: undefined;
                  error: {
                      code: string;
                      message: string;
                      data: GenericRecord<string>;
                  };
              };
    };
}

export class SaveTranslatedCollectionGqlGateway implements ISaveTranslatedCollectionGateway {
    private client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    async execute(
        translatedCollectionDto: TranslatedCollectionInputDto
    ): Promise<TranslatedCollectionDto> {
        const mutation = await this.client.mutate<MutationType>({
            mutation: MUTATION,
            variables: {
                collectionId: translatedCollectionDto.collectionId,
                languageCode: translatedCollectionDto.languageCode,
                items: translatedCollectionDto.items
            }
        });

        if (mutation.errors) {
            throw new WebinyError(mutation.errors[0].message);
        }

        if (!mutation.data) {
            throw new WebinyError(`No data was returned from "saveTranslatedCollection" mutation!`);
        }

        const { data, error } = mutation.data.translations.saveTranslatedCollection;

        if (!data) {
            throw new WebinyError(error);
        }

        return data;
    }
}
