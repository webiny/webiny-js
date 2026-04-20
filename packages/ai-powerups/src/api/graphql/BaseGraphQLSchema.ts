import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import { UpdateSettingsUseCase } from "~/api/features/UpdateSettings/index.js";

class BaseGraphQLSchemaImpl implements CoreGraphQLSchemaFactory.Interface {
  async execute(
    builder: CoreGraphQLSchemaFactory.SchemaBuilder,
  ): Promise<CoreGraphQLSchemaFactory.SchemaBuilder> {
    builder.addTypeDefs(/* GraphQL */ `
      type AiModel {
        providerId: String!
        providerName: String!
        modelId: String!
        modelName: String!
      }

      type AiPowerUpsQuery {
        listModels: [AiModel!]!
        getSettings: JSON
      }

      type AiPowerUpsMutation {
        updateSettings(input: JSON!): JSON!
      }

      extend type Query {
        aiPowerUps: AiPowerUpsQuery
      }

      extend type Mutation {
        aiPowerUps: AiPowerUpsMutation
      }
    `);

    builder.addResolver({
      path: "Query.aiPowerUps",
      resolver: () => () => ({}),
    });

    builder.addResolver({
      path: "Mutation.aiPowerUps",
      resolver: () => () => ({}),
    });

    builder.addResolver({
      path: "AiPowerUpsQuery.listModels",
      dependencies: [Ai],
      resolver: (ai: Ai.Interface) => {
        return async () => ai.listModels();
      },
    });

    builder.addResolver({
      path: "AiPowerUpsQuery.getSettings",
      dependencies: [GetSettingsUseCase],
      resolver: (useCase: GetSettingsUseCase.Interface) => {
        return async () => {
          const result = await useCase.execute();
          if (result.isOk()) {
            return result.value;
          }

          throw result.error;
        };
      },
    });

    builder.addResolver<{ input: UpdateSettingsUseCase.Params }>({
      path: "AiPowerUpsMutation.updateSettings",
      dependencies: [UpdateSettingsUseCase],
      resolver: (useCase: UpdateSettingsUseCase.Interface) => {
        return async ({ args }) => {
          const result = await useCase.execute(args.input);

          if (result.isFail()) {
            throw result.error;
          }
          return result.value;
        };
      },
    });

    return builder;
  }
}

export const BaseGraphQLSchema = CoreGraphQLSchemaFactory.createImplementation({
  implementation: BaseGraphQLSchemaImpl,
  dependencies: [],
});
