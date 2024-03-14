export interface IBinDeleteEntryGateway {
    execute: (id: string) => Promise<boolean>;
}
