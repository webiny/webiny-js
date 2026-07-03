import { createAbstraction } from "@webiny/feature/admin";

export interface IPersistedRegisteredTab {
    definitionId: string;
    query: string;
    variables: string;
}

export interface IPersistedUserTab {
    id: string;
    definitionId: string;
    name: string;
    endpoint: string;
    query: string;
    variables: string;
}

export interface IPersistedState {
    activeTabId: string;
    registeredTabs: IPersistedRegisteredTab[];
    userTabs: IPersistedUserTab[];
}

export interface IPlaygroundRepository {
    load(): IPersistedState | null;
    save(state: IPersistedState): void;
}

export const PlaygroundRepository =
    createAbstraction<IPlaygroundRepository>("PlaygroundRepository");

export namespace PlaygroundRepository {
    export type Interface = IPlaygroundRepository;
    export type PersistedState = IPersistedState;
    export type PersistedRegisteredTab = IPersistedRegisteredTab;
    export type PersistedUserTab = IPersistedUserTab;
}
