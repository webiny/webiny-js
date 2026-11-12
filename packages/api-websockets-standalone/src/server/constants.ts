/*
 * The one path the server takes WebSocket upgrades on. The admin dials it in `resolveWebsocketUrl`
 * (app-admin) and the dev proxy maps `/api/ws` to it (`pointAppsAtDevProxy`); neither can import from
 * an api package, so the value is repeated there.
 */
export const WEBSOCKETS_PATH = "/ws";
