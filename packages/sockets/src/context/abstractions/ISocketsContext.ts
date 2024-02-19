import { ISocketsConnectionRegistry, ISocketsConnectionRegistryData } from "~/registry";
import { ISocketsTransporterSendData } from "~/transporter";

export type ISocketsContextListConnectionsResponse = Promise<ISocketsConnectionRegistryData[]>;

export interface ISocketsIdentity {
    id: string;
}

export interface ISocketsContext {
    readonly registry: ISocketsConnectionRegistry;

    send<T extends ISocketsTransporterSendData = ISocketsTransporterSendData>(
        identity: ISocketsIdentity,
        data: T
    ): Promise<void>;
    listConnections(identity: ISocketsIdentity): ISocketsContextListConnectionsResponse;
}
