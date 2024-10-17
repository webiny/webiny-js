import type ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { GenericRecord } from "@webiny/app/types";
import { WebinyError } from "@webiny/error";
import { IGetTranslatedCollectionGateway } from "~/translations/translatedCollection/getTranslatedCollection/IGetTranslatedCollectionGateway";
import { TranslatedCollectionDto } from "~/translations/translatedCollection/getTranslatedCollection/TranslatedCollectionDto";

const QUERY = gql`
    query GetTranslatedCollection($collectionId: ID!, $languageCode: String!) {
        translations {
            getTranslatedCollection(collectionId: $collectionId, languageCode: $languageCode) {
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

interface QueryType {
    translations: {
        getTranslatedCollection:
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

export class GetTranslatedCollectionGateway implements IGetTranslatedCollectionGateway {
    private client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    async execute(collectionId: string, languageCode: string): Promise<TranslatedCollectionDto> {
        const query = await this.client.query<QueryType>({
            query: QUERY,
            variables: { collectionId, languageCode },
            fetchPolicy: "no-cache"
        });

        const { data, error } = query.data.translations.getTranslatedCollection;

        if (error) {
            throw new WebinyError(error);
        }

        return {
            collectionId: data.collectionId,
            languageCode: data.languageCode,
            items: data.items.map(item => ({
                itemId: item.itemId,
                baseValue: item.baseValue,
                baseValueModifiedOn: item.baseValueModifiedOn,
                value: item.value,
                context: item.context,
                translatedOn: item.translatedOn,
                translatedBy: item.translatedBy
                    ? {
                          id: item.translatedBy.id,
                          displayName: item.translatedBy.displayName
                      }
                    : undefined
            }))
        };
    }
}
