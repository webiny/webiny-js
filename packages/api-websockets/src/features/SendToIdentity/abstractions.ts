// Declared in api-core so that a package can send without depending on this one. Re-exported, not
// redeclared: a second token would leave every caller resolving something nothing implements.
export { WebsocketsSendToIdentityUseCase } from "@webiny/api-core/features/websockets/index.js";
