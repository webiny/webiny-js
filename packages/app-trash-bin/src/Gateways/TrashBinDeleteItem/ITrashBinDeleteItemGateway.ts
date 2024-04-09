export interface ITrashBinDeleteItemGateway {
    execute: (id: string) => Promise<boolean>;
}
