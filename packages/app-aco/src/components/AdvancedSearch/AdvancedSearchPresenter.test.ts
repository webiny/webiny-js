import { AdvancedSearchPresenter } from "./AdvancedSearchPresenter";
import {
    QueryObjectFilterDTO,
    QueryObjectGroupDTO,
    Operation,
    QueryObjectDTO,
    QueryObjectRepository
} from "./QueryObject";
import { createMockGateway } from "./utils/MockGateway";

describe("AdvancedSearchPresenter", () => {
    const modelId = "model-id";

    const demoFilter: QueryObjectFilterDTO = {
        field: "any-field",
        value: "any-value",
        condition: "any-condition"
    };
    const demoGroup: QueryObjectGroupDTO = {
        operation: Operation.AND,
        filters: [demoFilter]
    };

    const filter1: QueryObjectDTO = {
        id: "filter-1",
        name: "Filter 1",
        description: "Filter description",
        modelId,
        operation: Operation.AND,
        groups: [demoGroup]
    };

    const filter2: QueryObjectDTO = {
        id: "filter-2",
        name: "Filter 2",
        modelId,
        operation: Operation.AND,
        groups: [demoGroup]
    };

    const filter3: QueryObjectDTO = {
        id: "filter-3",
        name: "Filter 3",
        modelId,
        operation: Operation.AND,
        groups: [demoGroup]
    };

    const gateway = createMockGateway({
        list: jest.fn().mockImplementation(() => {
            return Promise.resolve([
                {
                    ...filter1,
                    groups: [JSON.stringify(demoGroup)]
                },
                {
                    ...filter2,
                    groups: [JSON.stringify(demoGroup)]
                }
            ]);
        }),
        get: jest.fn().mockImplementation(() => {
            return Promise.resolve({
                ...filter3,
                groups: [JSON.stringify(demoGroup)]
            });
        }),
        create: jest.fn().mockImplementation(() => {
            return Promise.resolve({
                ...filter1,
                groups: [JSON.stringify(demoGroup)]
            });
        }),
        update: jest.fn().mockImplementation(() => {
            return Promise.resolve({
                ...filter1,
                name: "Filter 1 - Edit",
                groups: [JSON.stringify(demoGroup)]
            });
        }),
        delete: jest.fn().mockImplementation(() => {
            return Promise.resolve(true);
        })
    });

    let presenter: AdvancedSearchPresenter;

    beforeEach(() => {
        jest.clearAllMocks();

        const repository = new QueryObjectRepository(gateway, modelId);
        presenter = new AdvancedSearchPresenter(repository);
    });

    it("should create a presenter and list filters from the gateway", async () => {
        // let's load some filters
        await presenter.load();

        expect(gateway.list).toBeCalledTimes(1);

        expect(presenter.vm).toEqual({
            appliedFilter: null,
            currentFilter: null,
            feedbackVm: {
                isOpen: false,
                message: ""
            },
            managerVm: {
                isOpen: false,
                view: "LIST",
                loadingLabel: "",
                filters: [
                    {
                        id: filter1.id,
                        name: filter1.name,
                        description: filter1.description
                    },
                    {
                        id: filter2.id,
                        name: filter2.name,
                        description: ""
                    }
                ]
            },
            builderVm: {
                isOpen: false
            },
            saverVm: {
                isOpen: false,
                isLoading: false,
                loadingLabel: "",
                filter: null
            }
        });
    });

    it("should be able to apply a filter", async () => {
        // let's load some filters
        await presenter.load();

        // Let's apply a filter
        await presenter.applyFilter("filter-1");

        expect(presenter.vm).toMatchObject({
            appliedFilter: filter1,
            currentFilter: null,
            managerVm: {
                isOpen: false
            },
            builderVm: {
                isOpen: false
            },
            saverVm: {
                isOpen: false
            }
        });
    });

    it("should be able to apply a queryObject", async () => {
        // let's load some filters
        await presenter.load();

        // Let's apply a queryObject
        presenter.applyQueryObject(filter2);

        expect(presenter.vm).toMatchObject({
            appliedFilter: filter2,
            managerVm: {
                isOpen: false
            },
            builderVm: {
                isOpen: false
            },
            saverVm: {
                isOpen: false
            }
        });
    });

    it("should be able to unset a filter", async () => {
        // let's load some filters
        await presenter.load();

        // Let's apply and unset the filter
        await presenter.applyFilter("filter-1");
        presenter.unsetFilter();

        expect(presenter.vm).toMatchObject({
            appliedFilter: null,
            currentFilter: null
        });
    });

    it("should be able to edit an already applied filter", async () => {
        // let's load some filters
        await presenter.load();

        // Let's apply and unset the filter
        await presenter.applyFilter("filter-1");
        presenter.editAppliedFilter();

        expect(presenter.vm).toMatchObject({
            appliedFilter: filter1,
            currentFilter: filter1,
            builderVm: {
                isOpen: true
            }
        });
    });

    it("should be create a new filter", async () => {
        // let's load some filters
        await presenter.load();

        // Let's open the filter manager
        presenter.openManager();
        expect(presenter.vm).toMatchObject({
            managerVm: {
                isOpen: true
            }
        });

        // Let's create a new filter via builder
        presenter.createFilter();
        expect(presenter.vm).toMatchObject({
            currentFilter: {
                id: "",
                name: "Draft filter",
                description: "",
                modelId,
                operation: Operation.AND,
                groups: [
                    {
                        operation: Operation.AND,
                        filters: [
                            {
                                field: "",
                                condition: "",
                                value: ""
                            }
                        ]
                    }
                ]
            },
            managerVm: {
                isOpen: false
            },
            builderVm: {
                isOpen: true
            },
            saverVm: {
                isOpen: false
            }
        });

        // Let's change the QueryObject and open the saver
        const queryObject = {
            id: "",
            name: "Draft filter",
            description: "",
            modelId,
            operation: Operation.AND,
            groups: [
                {
                    operation: Operation.OR,
                    filters: [
                        {
                            field: "Field value",
                            condition: "field_condition",
                            value: "Any value"
                        }
                    ]
                }
            ]
        };
        presenter.persistFilter(queryObject);
        expect(presenter.vm).toMatchObject({
            currentFilter: queryObject,
            managerVm: {
                isOpen: false
            },
            builderVm: {
                isOpen: true
            },
            saverVm: {
                isOpen: true
            }
        });

        // Let's save it via the gateway
        await presenter.saveFilter(queryObject);

        expect(gateway.create).toBeCalledTimes(1);
        expect(gateway.create).toHaveBeenCalledWith({
            id: expect.any(String),
            name: "Draft filter",
            description: "",
            modelId,
            operation: Operation.AND,
            groups: [JSON.stringify(queryObject.groups[0])]
        });
        expect(presenter.vm).toMatchObject({
            managerVm: {
                isOpen: false
            },
            builderVm: {
                isOpen: false
            },
            saverVm: {
                isOpen: false
            },
            feedbackVm: {
                isOpen: true,
                message: 'Filter "Draft filter" was successfully created.'
            }
        });

        // Let's open the manager again and check if the new filter is there.
        // Be aware: data comes from the mocked gateway
        presenter.openManager();
        expect(presenter.vm.managerVm.filters.length).toBe(3);
        expect(presenter.vm.managerVm.filters[0]).toEqual({
            id: "filter-1",
            name: "Filter 1",
            description: "Filter description"
        });
    });

    it("should be able to update an existing filter", async () => {
        // let's load some filters
        await presenter.load();

        // Let's open the filter manager
        presenter.openManager();
        expect(presenter.vm).toMatchObject({
            managerVm: {
                isOpen: true
            }
        });

        // Let's select a filter to edit in the builder
        await presenter.editFilter("filter-1");
        expect(presenter.vm).toMatchObject({
            currentFilter: filter1,
            managerVm: {
                isOpen: false
            },
            builderVm: {
                isOpen: true
            },
            saverVm: {
                isOpen: false
            }
        });

        // Let's change the QueryObject and open the saver
        const queryObject = {
            ...filter1,
            groups: [
                {
                    operation: Operation.OR,
                    filters: [
                        {
                            field: "Field value",
                            condition: "field_condition",
                            value: "Any value"
                        }
                    ]
                }
            ]
        };
        presenter.persistFilter(queryObject);
        expect(presenter.vm).toMatchObject({
            currentFilter: queryObject,
            managerVm: {
                isOpen: false
            },
            builderVm: {
                isOpen: true
            },
            saverVm: {
                isOpen: true
            }
        });

        // Let's save it via the gateway
        await presenter.saveFilter(queryObject);

        expect(gateway.update).toBeCalledTimes(1);
        expect(gateway.update).toHaveBeenCalledWith({
            id: "filter-1",
            name: "Filter 1",
            description: "Filter description",
            modelId,
            operation: Operation.AND,
            groups: [JSON.stringify(queryObject.groups[0])]
        });
        expect(presenter.vm).toMatchObject({
            managerVm: {
                isOpen: false
            },
            builderVm: {
                isOpen: false
            },
            saverVm: {
                isOpen: false
            },
            feedbackVm: {
                isOpen: true,
                message: 'Filter "Filter 1" was successfully updated.'
            }
        });

        // Let's open the manager again and check if the new data is there.
        // Be aware: data comes from the mocked gateway
        presenter.openManager();
        expect(presenter.vm.managerVm.filters.length).toBe(2);
        expect(presenter.vm.managerVm.filters[0]).toEqual({
            id: "filter-1",
            name: "Filter 1 - Edit",
            description: "Filter description"
        });
    });

    it("should be able to delete a filter", async () => {
        // let's load some filters
        await presenter.load();

        // Let's open the filter manager
        presenter.openManager();
        expect(presenter.vm).toMatchObject({
            managerVm: {
                isOpen: true
            }
        });

        // Let's delete a filter
        await presenter.deleteFilter("filter-1");
        expect(gateway.delete).toBeCalledTimes(1);
        expect(gateway.delete).toHaveBeenCalledWith("filter-1");
        expect(presenter.vm).toMatchObject({
            currentFilter: null,
            feedbackVm: {
                isOpen: true,
                message: 'Filter "Filter 1" was successfully deleted.'
            }
        });

        // Let's check if the filter has been deleted and is not in the manager.
        // Be aware: data comes from the mocked gateway
        presenter.openManager();
        expect(presenter.vm.managerVm.filters.length).toBe(1);
        expect(presenter.vm.managerVm.filters[0]).toEqual({
            id: "filter-2",
            name: "Filter 2",
            description: ""
        });
    });

    it("should be able to handle an empty list - error from the gateway", async () => {
        const message = "Gateway error while listing filters";
        const gateway = createMockGateway({
            list: jest.fn().mockRejectedValue(new Error(message))
        });

        const repository = new QueryObjectRepository(gateway, modelId);
        const presenter = new AdvancedSearchPresenter(repository);

        // Let's load the app, without filters
        await presenter.load();

        expect(presenter.vm).toMatchObject({
            managerVm: {
                isOpen: false,
                view: "EMPTY",
                loadingLabel: "",
                filters: []
            },
            feedbackVm: {
                isOpen: true,
                message
            }
        });
    });

    it("should be able to handle error while creating the filter", async () => {
        const message = "Gateway error while creating filter";
        const createGateway = createMockGateway({
            ...gateway,
            create: jest.fn().mockRejectedValue(new Error(message))
        });

        const repository = new QueryObjectRepository(createGateway, modelId);
        const presenter = new AdvancedSearchPresenter(repository);

        // Let's load some filters
        await presenter.load();

        // Let's try to save a QueryObject
        const queryObject = {
            id: "",
            name: "Draft filter",
            description: "",
            modelId,
            operation: Operation.AND,
            groups: [
                {
                    operation: Operation.OR,
                    filters: [
                        {
                            field: "Field value",
                            condition: "field_condition",
                            value: "Any value"
                        }
                    ]
                }
            ]
        };

        await presenter.saveFilter(queryObject);

        expect(presenter.vm).toMatchObject({
            feedbackVm: {
                isOpen: true,
                message
            }
        });
    });

    it("should be able to handle error while updating a filter", async () => {
        const message = "Gateway error while updating filter";
        const updateGateway = createMockGateway({
            ...gateway,
            update: jest.fn().mockRejectedValue(new Error(message))
        });

        const repository = new QueryObjectRepository(updateGateway, modelId);
        const presenter = new AdvancedSearchPresenter(repository);

        // Let's load some filters
        await presenter.load();

        // Let's try to save a QueryObject
        const queryObject = {
            ...filter1,
            name: filter1 + " - Edit"
        };

        await presenter.saveFilter(queryObject);

        expect(presenter.vm).toMatchObject({
            feedbackVm: {
                isOpen: true,
                message
            }
        });
    });

    it("should be able to handle error while deleting a filter", async () => {
        const message = "Gateway error while deleting filter";
        const updateGateway = createMockGateway({
            ...gateway,
            delete: jest.fn().mockRejectedValue(new Error(message))
        });

        const repository = new QueryObjectRepository(updateGateway, modelId);
        const presenter = new AdvancedSearchPresenter(repository);

        // Let's load some filters
        await presenter.load();

        await presenter.deleteFilter(filter1.id);

        expect(presenter.vm).toMatchObject({
            feedbackVm: {
                isOpen: true,
                message
            }
        });
    });

    it("should be able to show a feedback message", async () => {
        // let's load some filters
        await presenter.load();

        // Let's show any random feedback message
        presenter.showFeedback("Any message");
        expect(presenter.vm).toMatchObject({
            currentFilter: null,
            feedbackVm: {
                isOpen: true,
                message: "Any message"
            }
        });
    });
});
