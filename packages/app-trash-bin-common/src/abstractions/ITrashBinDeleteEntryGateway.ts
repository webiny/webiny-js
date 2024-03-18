export interface ITrashBinDeleteEntryGateway {
    execute: (id: string) => Promise<boolean>;
}
