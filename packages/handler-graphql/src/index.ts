export * from "./errors.js";
export { registerLegacyPluginsViaGqlContextEnhancer } from "./registerLegacyPluginsViaGqlContextEnhancer.js";
export * from "./responses.js";
export * from "./utils/index.js";
export * from "./plugins/index.js";
export * from "./processRequestBody.js";
export * from "./createResolverDecorator.js";
export * from "./ResolverDecoration.js";
export * from "./engine/index.js";

// Backward-compat stub — the Fastify GraphQL route was replaced by GraphQLRoute
// registered via GraphQLEngineFeature. This default export is a no-op.
export default () => [];
