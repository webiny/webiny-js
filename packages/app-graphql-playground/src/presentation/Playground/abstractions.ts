import { createAbstraction } from "@webiny/feature/admin";

export type IPlaygroundBottomPanel = "variables" | "headers";

export type IPlaygroundSchema = Record<string, any>;

export type ISchemaStatus = "idle" | "loading" | "ready";

export interface IPlaygroundTabVm {
    id: string;
    definitionId: string;
    name: string;
    endpoint: string;
    query: string;
    variables: string;
    headers: string;
    response: string;
    isExecuting: boolean;
    isRegistered: boolean;
    activeBottomPanel: IPlaygroundBottomPanel;
    isBottomPanelCollapsed: boolean;
}

export interface IPlaygroundEndpointVm {
    definitionId: string;
    name: string;
    endpoint: string;
}

export interface IPlaygroundVm {
    tabs: IPlaygroundTabVm[];
    activeTabId: string;
    activeTab: IPlaygroundTabVm | null;
    endpoints: IPlaygroundEndpointVm[];
    schema: IPlaygroundSchema | null;
    schemaStatus: ISchemaStatus;
}

export interface IPlaygroundPresenter {
    readonly vm: IPlaygroundVm;
    init(): void;
    selectTab(id: string): void;
    createTab(definitionId: string): void;
    closeTab(id: string): void;
    duplicateTab(id: string): void;
    renameTab(id: string, name: string): void;
    updateQuery(query: string): void;
    updateVariables(variables: string): void;
    updateHeaders(headers: string): void;
    updateEndpoint(endpoint: string): void;
    executeQuery(): void;
    prettifyQuery(): void;
    copyQuery(): Promise<void>;
    copyResponse(): Promise<void>;
    selectBottomPanel(panel: IPlaygroundBottomPanel): void;
    toggleBottomPanel(): void;
}

export const PlaygroundPresenter = createAbstraction<IPlaygroundPresenter>("PlaygroundPresenter");

export namespace PlaygroundPresenter {
    export type Interface = IPlaygroundPresenter;
    export type Vm = IPlaygroundVm;
    export type TabVm = IPlaygroundTabVm;
    export type EndpointVm = IPlaygroundEndpointVm;
    export type BottomPanel = IPlaygroundBottomPanel;
    export type Schema = IPlaygroundSchema;
    export type SchemaStatus = ISchemaStatus;
}
