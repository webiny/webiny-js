import { Abstraction, Container } from "@webiny/di";

/**
 * Per-request abstraction holding the child DI container.
 * Registered automatically on each request — available for injection into
 * per-request services that need access to the request-scoped container
 * (e.g. GraphQLEngine passing it as resolver contextValue).
 */
export const RequestContainer = new Abstraction<Container>("RequestContainer");
