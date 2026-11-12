/**
 * The websocket connection registry on DynamoDB, for the DynamoDB storage variants. It is a subpath
 * of its own (`@webiny/api-websockets-aws/ddb/index.js`), not part of the package index: the index
 * is the AWS transport, which every AWS API loads, including the Postgres one, and that must not
 * load DynamoDB code.
 */
export { WebsocketsConnectionRegistry } from "./WebsocketsConnectionRegistry.js";
export { WebsocketsDdbFeature } from "./WebsocketsDdbFeature.js";
