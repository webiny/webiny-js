import { ISocketsConnectionRegistry, ISocketsConnectionRegistryData } from "~/registry";
import { ISocketsTransporterSendConnection, ISocketsTransporterSendData } from "~/transporter";
import { SecurityIdentity } from "@webiny/api-security/types";

export type ISocketsContextListConnectionsResponse = Promise<ISocketsConnectionRegistryData[]>;

export type ISocketsIdentity = Pick<SecurityIdentity, "id">;

export interface ISocketsContext {
    readonly registry: ISocketsConnectionRegistry;

    send<T extends ISocketsTransporterSendData = ISocketsTransporterSendData>(
        identity: ISocketsIdentity,
        data: T
    ): Promise<void>;
    sendToConnection<T extends ISocketsTransporterSendData = ISocketsTransporterSendData>(
        connection: ISocketsTransporterSendConnection,
        data: T
    ): Promise<void>;
    listConnections(identity: ISocketsIdentity): ISocketsContextListConnectionsResponse;
}
