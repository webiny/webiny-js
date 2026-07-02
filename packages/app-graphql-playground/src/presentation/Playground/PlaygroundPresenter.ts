import { makeAutoObservable, reaction, runInAction } from "mobx";
import { getIntrospectionQuery, parse, print } from "graphql";
import { PlaygroundClient } from "../../features/playgroundClient/abstractions.js";
import { PlaygroundRepository } from "../../features/repository/abstractions.js";
import { PlaygroundTabRegistry } from "../../features/tabRegistry/abstractions.js";
import { PlaygroundPresenter } from "./abstractions.js";

const USER_TAB_ID_PREFIX = "user-";

const SAVE_DEBOUNCE_MS = 500;

interface ITabSeed {
    id: string;
    definitionId: string;
    name: string;
    endpoint: string;
    query: string;
    variables: string;
    headers: string;
    isRegistered: boolean;
}

class PlaygroundPresenterImpl implements PlaygroundPresenter.Interface {
    private readonly tabRegistry: PlaygroundTabRegistry.Interface;
    private readonly repository: PlaygroundRepository.Interface;
    private readonly definitions: Map<string, PlaygroundTabRegistry.TabDefinition>;
    private readonly pendingIntrospections: Set<string>;

    private initialized = false;
    private nextUserTabId = 1;
    private tabs: PlaygroundPresenter.TabVm[] = [];
    private activeTabId = "";
    private endpoints: PlaygroundPresenter.EndpointVm[] = [];
    private schemas = new Map<string, PlaygroundPresenter.Schema>();

    constructor(
        tabRegistry: PlaygroundTabRegistry.Interface,
        repository: PlaygroundRepository.Interface
    ) {
        this.tabRegistry = tabRegistry;
        this.repository = repository;
        this.definitions = new Map();
        this.pendingIntrospections = new Set();

        makeAutoObservable(
            this,
            {
                tabRegistry: false,
                repository: false,
                definitions: false,
                pendingIntrospections: false,
                initialized: false,
                nextUserTabId: false
            } as any,
            { autoBind: true }
        );
    }

    public get vm(): PlaygroundPresenter.Vm {
        const activeTab = this.getActiveTab();

        return {
            tabs: this.tabs,
            activeTabId: this.activeTabId,
            activeTab: activeTab as PlaygroundPresenter.TabVm,
            endpoints: this.endpoints,
            schema: this.getActiveSchema()
        };
    }

    public init(): void {
        if (this.initialized) {
            return;
        }
        this.initialized = true;

        const definitions = this.tabRegistry.getTabs();
        for (const definition of definitions) {
            this.definitions.set(definition.id, definition);
        }

        this.endpoints = definitions.map(definition => {
            return {
                definitionId: definition.id,
                name: definition.name,
                endpoint: definition.endpoint
            };
        });

        const persisted = this.repository.load();

        const registeredTabs = definitions.map(definition => {
            return this.createRegisteredTab(definition, persisted);
        });

        const userTabs = this.restoreUserTabs(persisted);

        this.tabs = [...registeredTabs, ...userTabs];
        this.activeTabId = this.resolveActiveTabId(persisted);

        this.setupPersistence();

        const activeTab = this.getActiveTab();
        if (activeTab) {
            this.loadSchema(activeTab);
        }
    }

    public selectTab(id: string): void {
        const tab = this.findTab(id);
        if (!tab) {
            return;
        }

        this.activeTabId = id;
        this.loadSchema(tab);
    }

    public createTab(definitionId: string): void {
        const definition = this.definitions.get(definitionId);
        if (!definition) {
            return;
        }

        const tab = this.buildTab({
            id: this.generateUserTabId(),
            definitionId,
            name: "New tab",
            endpoint: definition.endpoint,
            query: definition.defaultQuery,
            variables: "",
            headers: "",
            isRegistered: false
        });

        this.tabs.push(tab);
        this.activeTabId = tab.id;
        this.loadSchema(tab);
    }

    public closeTab(id: string): void {
        const index = this.tabs.findIndex(tab => tab.id === id);
        if (index === -1) {
            return;
        }

        const tab = this.tabs[index];
        if (tab.isRegistered) {
            return;
        }

        this.tabs.splice(index, 1);

        if (this.activeTabId !== id) {
            return;
        }

        const fallback = this.tabs[index - 1] || this.tabs[0];
        if (fallback) {
            this.activeTabId = fallback.id;
        } else {
            this.activeTabId = "";
        }
    }

    public duplicateTab(id: string): void {
        const source = this.findTab(id);
        if (!source) {
            return;
        }

        const tab = this.buildTab({
            id: this.generateUserTabId(),
            definitionId: source.definitionId,
            name: `${source.name} (copy)`,
            endpoint: source.endpoint,
            query: source.query,
            variables: source.variables,
            headers: source.headers,
            isRegistered: false
        });

        this.tabs.push(tab);
        this.activeTabId = tab.id;
        this.loadSchema(tab);
    }

    public renameTab(id: string, name: string): void {
        const tab = this.findTab(id);
        if (!tab) {
            return;
        }
        if (tab.isRegistered) {
            return;
        }

        tab.name = name;
    }

    public updateQuery(query: string): void {
        const tab = this.getActiveTab();
        if (!tab) {
            return;
        }

        tab.query = query;
    }

    public updateVariables(variables: string): void {
        const tab = this.getActiveTab();
        if (!tab) {
            return;
        }

        tab.variables = variables;
    }

    public updateHeaders(headers: string): void {
        const tab = this.getActiveTab();
        if (!tab) {
            return;
        }

        tab.headers = headers;
    }

    public updateEndpoint(endpoint: string): void {
        const tab = this.getActiveTab();
        if (!tab) {
            return;
        }

        tab.endpoint = endpoint;
    }

    public executeQuery(): void {
        const tab = this.getActiveTab();
        if (!tab) {
            return;
        }
        if (tab.isExecuting) {
            return;
        }

        const definition = this.definitions.get(tab.definitionId);
        if (!definition) {
            return;
        }

        tab.isExecuting = true;

        const request: PlaygroundClient.Request = {
            query: tab.query,
            endpoint: tab.endpoint,
            variables: this.parseJson<Record<string, any>>(tab.variables),
            headers: this.parseJson<Record<string, string>>(tab.headers)
        };

        definition.client
            .execute(request)
            .then(result => {
                runInAction(() => {
                    tab.response = JSON.stringify(result, null, 2);
                    tab.isExecuting = false;
                });
            })
            .catch(error => {
                runInAction(() => {
                    tab.response = this.stringifyError(error);
                    tab.isExecuting = false;
                });
            });
    }

    public prettifyQuery(): void {
        const tab = this.getActiveTab();
        if (!tab) {
            return;
        }

        try {
            const parsed = parse(tab.query);
            tab.query = print(parsed);
        } catch {
            /* Invalid query — leave it unchanged. */
        }
    }

    public async copyQuery(): Promise<void> {
        const tab = this.getActiveTab();
        if (!tab) {
            return;
        }

        await navigator.clipboard.writeText(tab.query);
    }

    public async copyResponse(): Promise<void> {
        const tab = this.getActiveTab();
        if (!tab) {
            return;
        }

        await navigator.clipboard.writeText(tab.response);
    }

    public selectBottomPanel(panel: PlaygroundPresenter.BottomPanel): void {
        const tab = this.getActiveTab();
        if (!tab) {
            return;
        }

        tab.activeBottomPanel = panel;
        tab.isBottomPanelCollapsed = false;
    }

    public toggleBottomPanel(): void {
        const tab = this.getActiveTab();
        if (!tab) {
            return;
        }

        tab.isBottomPanelCollapsed = !tab.isBottomPanelCollapsed;
    }

    private createRegisteredTab(
        definition: PlaygroundTabRegistry.TabDefinition,
        persisted: PlaygroundRepository.PersistedState | null
    ): PlaygroundPresenter.TabVm {
        let query = definition.defaultQuery;
        let variables = "";

        if (persisted) {
            const persistedTab = persisted.registeredTabs.find(tab => {
                return tab.definitionId === definition.id;
            });
            if (persistedTab) {
                query = persistedTab.query;
                variables = persistedTab.variables;
            }
        }

        return this.buildTab({
            id: definition.id,
            definitionId: definition.id,
            name: definition.name,
            endpoint: definition.endpoint,
            query,
            variables,
            headers: "",
            isRegistered: true
        });
    }

    private restoreUserTabs(
        persisted: PlaygroundRepository.PersistedState | null
    ): PlaygroundPresenter.TabVm[] {
        if (!persisted) {
            return [];
        }

        return persisted.userTabs.map(persistedTab => {
            this.bumpNextUserTabId(persistedTab.id);

            return this.buildTab({
                id: persistedTab.id,
                definitionId: persistedTab.definitionId,
                name: persistedTab.name,
                endpoint: persistedTab.endpoint,
                query: persistedTab.query,
                variables: persistedTab.variables,
                headers: "",
                isRegistered: false
            });
        });
    }

    private buildTab(seed: ITabSeed): PlaygroundPresenter.TabVm {
        return {
            ...seed,
            response: "",
            isExecuting: false,
            activeBottomPanel: "variables",
            isBottomPanelCollapsed: true
        };
    }

    private resolveActiveTabId(persisted: PlaygroundRepository.PersistedState | null): string {
        if (persisted) {
            const exists = this.tabs.some(tab => tab.id === persisted.activeTabId);
            if (exists) {
                return persisted.activeTabId;
            }
        }

        if (this.tabs.length > 0) {
            return this.tabs[0].id;
        }

        return "";
    }

    private setupPersistence(): void {
        reaction(
            () => this.buildPersistedState(),
            state => {
                this.repository.save(state);
            },
            { delay: SAVE_DEBOUNCE_MS }
        );
    }

    private buildPersistedState(): PlaygroundRepository.PersistedState {
        const registeredTabs: PlaygroundRepository.PersistedRegisteredTab[] = [];
        const userTabs: PlaygroundRepository.PersistedUserTab[] = [];

        for (const tab of this.tabs) {
            if (tab.isRegistered) {
                registeredTabs.push({
                    definitionId: tab.definitionId,
                    query: tab.query,
                    variables: tab.variables
                });
            } else {
                userTabs.push({
                    id: tab.id,
                    definitionId: tab.definitionId,
                    name: tab.name,
                    endpoint: tab.endpoint,
                    query: tab.query,
                    variables: tab.variables
                });
            }
        }

        return {
            activeTabId: this.activeTabId,
            registeredTabs,
            userTabs
        };
    }

    private loadSchema(tab: PlaygroundPresenter.TabVm): void {
        const endpoint = tab.endpoint;
        if (this.schemas.has(endpoint)) {
            return;
        }
        if (this.pendingIntrospections.has(endpoint)) {
            return;
        }

        const definition = this.definitions.get(tab.definitionId);
        if (!definition) {
            return;
        }

        this.pendingIntrospections.add(endpoint);

        const query = getIntrospectionQuery();

        definition.client
            .execute({ query, endpoint })
            .then(result => {
                const schema = this.extractSchema(result);
                runInAction(() => {
                    this.pendingIntrospections.delete(endpoint);
                    if (schema) {
                        this.schemas.set(endpoint, schema);
                    }
                });
            })
            .catch(() => {
                this.pendingIntrospections.delete(endpoint);
            });
    }

    private extractSchema(result: PlaygroundClient.Response): PlaygroundPresenter.Schema | null {
        if (!result) {
            return null;
        }

        const data = result.data || result;
        if (!data.__schema) {
            return null;
        }

        return data.__schema;
    }

    private getActiveSchema(): PlaygroundPresenter.Schema | null {
        const tab = this.getActiveTab();
        if (!tab) {
            return null;
        }

        const schema = this.schemas.get(tab.endpoint);
        if (!schema) {
            return null;
        }

        return schema;
    }

    private getActiveTab(): PlaygroundPresenter.TabVm | null {
        const tab = this.findTab(this.activeTabId);
        if (tab) {
            return tab;
        }

        if (this.tabs.length > 0) {
            return this.tabs[0];
        }

        return null;
    }

    private findTab(id: string): PlaygroundPresenter.TabVm | null {
        const tab = this.tabs.find(item => item.id === id);
        if (!tab) {
            return null;
        }

        return tab;
    }

    private generateUserTabId(): string {
        const id = `${USER_TAB_ID_PREFIX}${this.nextUserTabId}`;
        this.nextUserTabId = this.nextUserTabId + 1;

        return id;
    }

    private bumpNextUserTabId(id: string): void {
        if (!id.startsWith(USER_TAB_ID_PREFIX)) {
            return;
        }

        const numeric = parseInt(id.slice(USER_TAB_ID_PREFIX.length), 10);
        if (isNaN(numeric)) {
            return;
        }

        if (numeric >= this.nextUserTabId) {
            this.nextUserTabId = numeric + 1;
        }
    }

    private parseJson<T>(value: string): T | undefined {
        if (!value) {
            return undefined;
        }

        try {
            const parsed = JSON.parse(value);
            return parsed as T;
        } catch {
            return undefined;
        }
    }

    private stringifyError(error: unknown): string {
        if (error instanceof Error) {
            if (error.cause) {
                return JSON.stringify({ errors: error.cause }, null, 2);
            }

            return JSON.stringify({ error: error.message }, null, 2);
        }

        return JSON.stringify({ error }, null, 2);
    }
}

export const DefaultPlaygroundPresenter = PlaygroundPresenter.createImplementation({
    implementation: PlaygroundPresenterImpl,
    dependencies: [PlaygroundTabRegistry, PlaygroundRepository]
});
