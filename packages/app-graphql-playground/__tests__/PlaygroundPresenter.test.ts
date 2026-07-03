import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { print } from "graphql";
import { parse } from "graphql";
import type { PlaygroundTabRegistry } from "~/features/tabRegistry/abstractions.js";
import type { PlaygroundRepository } from "~/features/repository/abstractions.js";
import type { PlaygroundClient } from "~/features/playgroundClient/abstractions/PlaygroundClient.js";
import { DefaultPlaygroundPresenter } from "~/presentation/Playground/PlaygroundPresenter.js";
import type { IPlaygroundPresenter } from "~/presentation/Playground/abstractions.js";

function createMockClient(
    response: Record<string, any> = { data: { test: { id: "1" } } }
): PlaygroundClient.Interface {
    return {
        execute: vi.fn().mockResolvedValue(response)
    };
}

function createMockRegistry(
    client: PlaygroundClient.Interface,
    definitions?: PlaygroundTabRegistry.TabDefinition[]
): PlaygroundTabRegistry.Interface {
    const tabs: PlaygroundTabRegistry.TabDefinition[] = definitions || [
        {
            id: "main-api",
            name: "Main API",
            endpoint: "http://localhost:3000/graphql",
            client,
            defaultQuery: "{ listItems { id } }"
        },
        {
            id: "manage-api",
            name: "Manage API",
            endpoint: "http://localhost:3000/manage",
            client,
            defaultQuery: "{ getModels { modelId } }"
        }
    ];

    return {
        getTabs: () => tabs
    };
}

function createMockRepository(
    persistedState: PlaygroundRepository.PersistedState | null = null
): PlaygroundRepository.Interface {
    return {
        load: vi.fn().mockReturnValue(persistedState),
        save: vi.fn()
    };
}

/*
 * createImplementation returns the class itself at runtime (with DI metadata attached).
 * We cast to any to bypass the branded type and call new directly.
 */
function createPresenter(params: {
    registry: PlaygroundTabRegistry.Interface;
    repository: PlaygroundRepository.Interface;
}): IPlaygroundPresenter {
    const Ctor = DefaultPlaygroundPresenter as any;
    const presenter = new Ctor(params.registry, params.repository);
    return presenter as IPlaygroundPresenter;
}

describe("PlaygroundPresenter", () => {
    let mockClient: PlaygroundClient.Interface;
    let mockRegistry: PlaygroundTabRegistry.Interface;
    let mockRepository: PlaygroundRepository.Interface;

    beforeEach(() => {
        vi.useFakeTimers();
        mockClient = createMockClient();
        mockRegistry = createMockRegistry(mockClient);
        mockRepository = createMockRepository();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("init()", () => {
        it("should create tabs from registry when no persisted state exists", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });

            presenter.init();

            const vm = presenter.vm;
            expect(vm.tabs).toHaveLength(2);
            expect(vm.tabs[0].id).toBe("main-api");
            expect(vm.tabs[0].name).toBe("Main API");
            expect(vm.tabs[0].endpoint).toBe("http://localhost:3000/graphql");
            expect(vm.tabs[0].query).toBe("{ listItems { id } }");
            expect(vm.tabs[0].isRegistered).toBe(true);
            expect(vm.tabs[1].id).toBe("manage-api");
            expect(vm.tabs[1].isRegistered).toBe(true);
            expect(vm.activeTabId).toBe("main-api");
        });

        it("should restore persisted state for registered tabs", () => {
            const persisted: PlaygroundRepository.PersistedState = {
                activeTabId: "manage-api",
                registeredTabs: [
                    {
                        definitionId: "main-api",
                        query: "{ customQuery { name } }",
                        variables: '{ "limit": 10 }'
                    }
                ],
                userTabs: []
            };

            mockRepository = createMockRepository(persisted);
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });

            presenter.init();

            const vm = presenter.vm;
            /* Registered tab should use persisted query/variables. */
            expect(vm.tabs[0].query).toBe("{ customQuery { name } }");
            expect(vm.tabs[0].variables).toBe('{ "limit": 10 }');
            /* Active tab should be restored. */
            expect(vm.activeTabId).toBe("manage-api");
        });

        it("should restore user tabs from persisted state", () => {
            const persisted: PlaygroundRepository.PersistedState = {
                activeTabId: "user-1",
                registeredTabs: [],
                userTabs: [
                    {
                        id: "user-1",
                        definitionId: "main-api",
                        name: "My custom tab",
                        endpoint: "http://localhost:3000/graphql",
                        query: "{ myQuery }",
                        variables: ""
                    }
                ]
            };

            mockRepository = createMockRepository(persisted);
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });

            presenter.init();

            const vm = presenter.vm;
            /* Should have 2 registered + 1 user tab. */
            expect(vm.tabs).toHaveLength(3);
            const userTab = vm.tabs.find(tab => tab.id === "user-1");
            expect(userTab).toBeDefined();
            expect(userTab!.name).toBe("My custom tab");
            expect(userTab!.isRegistered).toBe(false);
            expect(vm.activeTabId).toBe("user-1");
        });

        it("should be idempotent - calling init() twice does not duplicate tabs", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });

            presenter.init();
            presenter.init();

            expect(presenter.vm.tabs).toHaveLength(2);
        });

        it("should populate endpoints from registry definitions", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });

            presenter.init();

            const vm = presenter.vm;
            expect(vm.endpoints).toHaveLength(2);
            expect(vm.endpoints[0].definitionId).toBe("main-api");
            expect(vm.endpoints[0].name).toBe("Main API");
            expect(vm.endpoints[0].endpoint).toBe("http://localhost:3000/graphql");
        });
    });

    describe("selectTab()", () => {
        it("should change the active tab id", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();

            presenter.selectTab("manage-api");

            expect(presenter.vm.activeTabId).toBe("manage-api");
        });

        it("should not change active tab when selecting a nonexistent id", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();

            presenter.selectTab("does-not-exist");

            expect(presenter.vm.activeTabId).toBe("main-api");
        });
    });

    describe("createTab()", () => {
        it("should add a user tab for the given definition", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();

            presenter.createTab("main-api");

            const vm = presenter.vm;
            expect(vm.tabs).toHaveLength(3);
            const newTab = vm.tabs[2];
            expect(newTab.id).toBe("user-1");
            expect(newTab.name).toBe("New tab");
            expect(newTab.isRegistered).toBe(false);
            expect(newTab.definitionId).toBe("main-api");
            expect(newTab.endpoint).toBe("http://localhost:3000/graphql");
            expect(newTab.query).toBe("{ listItems { id } }");
            /* Active tab should switch to the new tab. */
            expect(vm.activeTabId).toBe("user-1");
        });

        it("should not create a tab for an unknown definition", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();

            presenter.createTab("nonexistent");

            expect(presenter.vm.tabs).toHaveLength(2);
        });

        it("should generate unique ids for multiple user tabs", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();

            presenter.createTab("main-api");
            presenter.createTab("main-api");

            expect(presenter.vm.tabs).toHaveLength(4);
            expect(presenter.vm.tabs[2].id).toBe("user-1");
            expect(presenter.vm.tabs[3].id).toBe("user-2");
        });
    });

    describe("closeTab()", () => {
        it("should remove a user tab", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();
            presenter.createTab("main-api");
            expect(presenter.vm.tabs).toHaveLength(3);

            presenter.closeTab("user-1");

            expect(presenter.vm.tabs).toHaveLength(2);
        });

        it("should not remove a registered tab", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();

            presenter.closeTab("main-api");

            expect(presenter.vm.tabs).toHaveLength(2);
        });

        it("should update active tab when closing the active user tab", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();
            presenter.createTab("main-api");
            /* user-1 is now active. */
            expect(presenter.vm.activeTabId).toBe("user-1");

            presenter.closeTab("user-1");

            /* Should fall back to the previous tab. */
            expect(presenter.vm.tabs).toHaveLength(2);
            const activeId = presenter.vm.activeTabId;
            expect(activeId).not.toBe("user-1");
            expect(activeId).toBeTruthy();
        });

        it("should not change active tab when closing a non-active user tab", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();
            presenter.createTab("main-api");
            presenter.createTab("manage-api");
            /* user-2 is active, close user-1. */
            expect(presenter.vm.activeTabId).toBe("user-2");

            presenter.closeTab("user-1");

            expect(presenter.vm.activeTabId).toBe("user-2");
            expect(presenter.vm.tabs).toHaveLength(3);
        });
    });

    describe("duplicateTab()", () => {
        it("should create a user tab copy of a registered tab", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();

            presenter.duplicateTab("main-api");

            const vm = presenter.vm;
            expect(vm.tabs).toHaveLength(3);
            const duplicate = vm.tabs[2];
            expect(duplicate.id).toBe("user-1");
            expect(duplicate.name).toBe("Main API (copy)");
            expect(duplicate.endpoint).toBe("http://localhost:3000/graphql");
            expect(duplicate.query).toBe("{ listItems { id } }");
            expect(duplicate.isRegistered).toBe(false);
            expect(vm.activeTabId).toBe("user-1");
        });

        it("should do nothing when duplicating a nonexistent tab", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();

            presenter.duplicateTab("nope");

            expect(presenter.vm.tabs).toHaveLength(2);
        });
    });

    describe("renameTab()", () => {
        it("should rename a user tab", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();
            presenter.createTab("main-api");

            presenter.renameTab("user-1", "Custom Name");

            const tab = presenter.vm.tabs.find(t => t.id === "user-1");
            expect(tab!.name).toBe("Custom Name");
        });

        it("should not rename a registered tab", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();

            presenter.renameTab("main-api", "Renamed");

            const tab = presenter.vm.tabs.find(t => t.id === "main-api");
            expect(tab!.name).toBe("Main API");
        });
    });

    describe("updateQuery() / updateVariables() / updateHeaders() / updateEndpoint()", () => {
        it("should update the active tab query", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();

            presenter.updateQuery("{ newQuery }");

            expect(presenter.vm.activeTab!.query).toBe("{ newQuery }");
        });

        it("should update the active tab variables", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();

            presenter.updateVariables('{ "key": "value" }');

            expect(presenter.vm.activeTab!.variables).toBe('{ "key": "value" }');
        });

        it("should update the active tab headers", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();

            presenter.updateHeaders('{ "Authorization": "Bearer token" }');

            expect(presenter.vm.activeTab!.headers).toBe('{ "Authorization": "Bearer token" }');
        });

        it("should update the endpoint of a user-created tab", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();
            presenter.createTab("main-api");
            const userTab = presenter.vm.tabs.find(t => !t.isRegistered)!;
            presenter.selectTab(userTab.id);

            presenter.updateEndpoint("http://new-endpoint/graphql");

            expect(presenter.vm.activeTab!.endpoint).toBe("http://new-endpoint/graphql");
        });

        it("should not update the endpoint of a registered tab", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();

            const originalEndpoint = presenter.vm.activeTab!.endpoint;
            presenter.updateEndpoint("http://new-endpoint/graphql");

            expect(presenter.vm.activeTab!.endpoint).toBe(originalEndpoint);
        });
    });

    describe("executeQuery()", () => {
        it("should call client.execute with correct params and set response", async () => {
            const responseData = { data: { listItems: [{ id: "1" }] } };
            mockClient = createMockClient(responseData);
            mockRegistry = createMockRegistry(mockClient);

            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();
            presenter.updateVariables('{ "limit": 5 }');
            presenter.updateHeaders('{ "X-Custom": "header" }');

            presenter.executeQuery();

            /* The client.execute is called asynchronously, flush microtasks. */
            await vi.advanceTimersByTimeAsync(0);

            expect(mockClient.execute).toHaveBeenCalledWith({
                query: "{ listItems { id } }",
                endpoint: "http://localhost:3000/graphql",
                variables: { limit: 5 },
                headers: { "X-Custom": "header" }
            });

            expect(presenter.vm.activeTab!.response).toBe(JSON.stringify(responseData, null, 2));
            expect(presenter.vm.activeTab!.isExecuting).toBe(false);
        });

        it("should set error response on network error without throwing", async () => {
            const error = new Error("Network failure");
            mockClient = {
                execute: vi.fn().mockRejectedValue(error)
            };
            mockRegistry = createMockRegistry(mockClient);

            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();

            presenter.executeQuery();

            await vi.advanceTimersByTimeAsync(0);

            const response = presenter.vm.activeTab!.response;
            const parsed = JSON.parse(response);
            expect(parsed.error).toBe("Network failure");
            expect(presenter.vm.activeTab!.isExecuting).toBe(false);
        });

        it("should not execute when already executing", async () => {
            const resolvers: Array<(value: any) => void> = [];
            mockClient = {
                execute: vi.fn().mockImplementation(() => {
                    return new Promise(resolve => {
                        resolvers.push(resolve);
                    });
                })
            };
            mockRegistry = createMockRegistry(mockClient);

            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();

            /* init() triggers an introspection call, so record the count before. */
            const callsBeforeExecute = (mockClient.execute as ReturnType<typeof vi.fn>).mock.calls
                .length;

            presenter.executeQuery();
            presenter.executeQuery();

            /* Only one additional call should have been made (second is blocked). */
            const callsAfterExecute = (mockClient.execute as ReturnType<typeof vi.fn>).mock.calls
                .length;
            expect(callsAfterExecute - callsBeforeExecute).toBe(1);

            /* Resolve the pending promises to clean up. */
            for (const resolve of resolvers) {
                resolve({ data: {} });
            }
            await vi.advanceTimersByTimeAsync(0);
        });
    });

    describe("prettifyQuery()", () => {
        it("should format a valid GraphQL query", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();

            /* Set an unformatted query. */
            presenter.updateQuery("{listItems{id  name}}");

            presenter.prettifyQuery();

            /* The prettified version should match graphql print(parse(...)). */
            const expected = print(parse("{listItems{id  name}}"));
            expect(presenter.vm.activeTab!.query).toBe(expected);
        });

        it("should leave an invalid query unchanged", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();

            presenter.updateQuery("this is not valid graphql {{{{");

            presenter.prettifyQuery();

            expect(presenter.vm.activeTab!.query).toBe("this is not valid graphql {{{{");
        });
    });

    describe("selectBottomPanel() / toggleBottomPanel()", () => {
        it("should select a bottom panel and uncollapse it", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();

            presenter.selectBottomPanel("headers");

            expect(presenter.vm.activeTab!.activeBottomPanel).toBe("headers");
            expect(presenter.vm.activeTab!.isBottomPanelCollapsed).toBe(false);
        });

        it("should toggle the bottom panel collapsed state", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();

            /* Initially collapsed. */
            expect(presenter.vm.activeTab!.isBottomPanelCollapsed).toBe(true);

            presenter.toggleBottomPanel();
            expect(presenter.vm.activeTab!.isBottomPanelCollapsed).toBe(false);

            presenter.toggleBottomPanel();
            expect(presenter.vm.activeTab!.isBottomPanelCollapsed).toBe(true);
        });
    });

    describe("persistence", () => {
        it("should trigger repository.save after mutations with debounce", async () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();

            presenter.updateQuery("{ changed }");

            /* save should not be called immediately. */
            expect(mockRepository.save).not.toHaveBeenCalled();

            /* Advance past the 500ms debounce. */
            await vi.advanceTimersByTimeAsync(600);

            expect(mockRepository.save).toHaveBeenCalled();
            const savedState = (mockRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
            expect(savedState.activeTabId).toBe("main-api");
            expect(savedState.registeredTabs).toHaveLength(2);
        });

        it("should persist user tabs without headers", async () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });
            presenter.init();
            presenter.createTab("main-api");
            presenter.updateHeaders('{ "Authorization": "token" }');

            await vi.advanceTimersByTimeAsync(600);

            const savedState = (mockRepository.save as ReturnType<typeof vi.fn>).mock.calls.at(
                -1
            )![0];
            const userTab = savedState.userTabs.find(
                (t: PlaygroundRepository.PersistedUserTab) => t.id === "user-1"
            );
            expect(userTab).toBeDefined();
            /* Headers are not persisted. */
            expect(userTab.headers).toBeUndefined();
        });
    });

    describe("schemaStatus", () => {
        it("should be idle before init", () => {
            const presenter = createPresenter({
                registry: mockRegistry,
                repository: mockRepository
            });

            expect(presenter.vm.schemaStatus).toBe("idle");
        });

        it("should be loading while introspection is in flight", () => {
            const pendingClient: PlaygroundClient.Interface = {
                execute: vi.fn().mockImplementation(() => {
                    return new Promise<void>(resolve => {
                        resolve();
                    });
                })
            };
            const registry = createMockRegistry(pendingClient);
            const presenter = createPresenter({
                registry,
                repository: mockRepository
            });

            presenter.init();

            expect(presenter.vm.schemaStatus).toBe("loading");
        });

        it("should be ready after introspection completes", async () => {
            const schemaResponse = {
                data: {
                    __schema: {
                        queryType: { name: "Query" },
                        mutationType: null,
                        subscriptionType: null,
                        types: [
                            {
                                name: "Query",
                                kind: "OBJECT",
                                fields: [],
                                description: null,
                                inputFields: null,
                                enumValues: null,
                                interfaces: [],
                                possibleTypes: null
                            }
                        ]
                    }
                }
            };
            const client = createMockClient(schemaResponse);
            const registry = createMockRegistry(client);
            const presenter = createPresenter({
                registry,
                repository: mockRepository
            });

            presenter.init();
            await vi.runAllTimersAsync();

            expect(presenter.vm.schemaStatus).toBe("ready");
        });
    });
});
