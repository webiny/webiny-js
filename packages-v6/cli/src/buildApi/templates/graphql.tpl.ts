/**
 * GraphQL Lambda Handler
 */
import { APIGatewayProxyResult, APIGatewayProxyHandler } from "aws-lambda";
import { composeAsync, ConfigModifier, FunctionHandlerConfig, PluginsModifier } from "@webiny/core";
import { createHandler } from "@webiny/handler-aws";
import graphqlPlugins from "@webiny/handler-graphql";
import { Plugin } from "@webiny/plugins";

const debug = process.env.DEBUG === "true";

const loadPlugins = new Promise<Plugin[]>(async (resolve) => {
  // Config phase (ADD GENERATED CONFIG MODIFIERS HERE!)
  const configModifiers: ConfigModifier<FunctionHandlerConfig>[] = [];

  const config = await composeAsync(configModifiers)({ debug });

  // Generated plugins (ADD GENERATED PLUGINS MODIFIERS HERE!)
  const pluginsModifiers: PluginsModifier<Plugin>[] = [];

  const plugins = await composeAsync(pluginsModifiers)([]);

  resolve(plugins);
});

// Handler creation phase
let handlerInstance: Function;
export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  if (!handlerInstance) {
    const plugins = await loadPlugins;
    handlerInstance = createHandler({
      plugins: [graphqlPlugins({ debug }), ...plugins],
      http: { debug },
    }) as Function;
  }

  return handlerInstance(event);
};
