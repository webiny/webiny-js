import type ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { WebinyError } from "@webiny/error";
import { ISaveTranslatableCollectionGateway } from "~/translations/translatableCollection/saveTranslatableCollection/ISaveTranslatableCollectionGateway";
import { TranslatableCollectionInputDto } from "./TranslatableCollectionInputDto";

const MUTATION = gql`
    mutation SaveTranslatableCollection($collectionId: ID!, $items: [TranslatableItemInput!]!) {
        translations {
            saveTranslatableCollection(collectionId: $collectionId, items: $items) {
                data {
                    collectionId
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

export class SaveTranslatableCollectionGqlGateway implements ISaveTranslatableCollectionGateway {
    private client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    async execute(translatableCollectionDto: TranslatableCollectionInputDto): Promise<void> {
        const { data } = await this.client.mutate({
            mutation: MUTATION,
            variables: {
                collectionId: translatableCollectionDto.collectionId,
                items: translatableCollectionDto.items
            }
        });

        const { error } = data.translations.saveTranslatableCollection;

        if (error) {
            throw new WebinyError(error);
        }
    }
}
