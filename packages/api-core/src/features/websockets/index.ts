export { WebsocketsSendToIdentityUseCase } from "./SendToIdentity/abstractions.js";
export { NullSendToIdentityUseCase } from "./SendToIdentity/NullSendToIdentityUseCase.js";
export {
    WebsocketServiceError,
    WebsocketForceDisconnectNotificationError,
    WebsocketForceDisconnectError
} from "./errors.js";
export type { WebsocketsError } from "./errors.js";
export type {
    IWebsocketsIdentity,
    IWebsocketsTransportSendData,
    IWebsocketsTransportSendDataError
} from "./types.js";
