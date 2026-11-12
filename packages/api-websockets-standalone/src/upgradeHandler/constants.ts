/*
 * The one path the server takes WebSocket upgrades on. The admin dials it in `resolveWebsocketUrl`
 * (app-admin), which can't import from an api package, so the value is repeated there.
 */
export const WEBSOCKETS_PATH = "/ws";
