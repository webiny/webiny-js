import { AdvancedSearchPresenter } from "./AdvancedSearchPresenter";
import {
    FilterDTO,
    FilterRepository,
    Operation,
    QueryObjectDTO,
    QueryObjectFilterDTO,
    QueryObjectGroupDTO,
    User
} from "./domain";
import { FiltersGatewayInterface } from "./gateways";

const mockGateway: FiltersGatewayInterface = {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
};

const createMockGateway = ({
    list,
    get,
    create,
    update,
    delete: deleteFn
}: Partial<FiltersGatewayInterface>): FiltersGatewayInterface => ({
    ...mockGateway,
    ...(list && { list }),
    ...(get && { get }),
    ...(create && { create }),
    ...(update && { update }),
    ...(deleteFn && { delete: deleteFn })
});

const wrapQueryObjectIntoFilter = (queryObject: QueryObjectDTO): FilterDTO => {
    const DemoUser: User = {
        id: "any-id",
        displayName: "John Doe",
        type: "editor"
    };

    return {
        ...queryObject,
        createdOn: new Date().toString(),
        savedOn: new Date().toString(),
        createdBy: DemoUser
    };
};

describe("AdvancedSearchPresenter", () => {
    const namespace = "namespace";

    const demoFilter: QueryObjectFilterDTO = {
        field: "any-field",
        value: "any-value",
        condition: "any-condition"
    };

    const demoGroup: QueryObjectGroupDTO = {
        operation: Operation.AND,
        filters: [demoFilter]
    };

    const queryObject1: QueryObjectDTO = {
        id: "filter-1",
        name: "Filter 1",
        description: "Filter description",
        namespace,
        operation: Operation.AND,
        groups: [demoGroup]
    };

    const filter1 = wrapQueryObjectIntoFilter(queryObject1);

    const queryObject2: QueryObjectDTO = {
        id: "filter-2",
        name: "Filter 2",
        namespace,
        operation: Operation.AND,
        groups: [demoGroup]
    };

    const filter2 = wrapQueryObjectIntoFilter(queryObject2);

    const queryObject3: QueryObjectDTO = {
        id: "filter-3",
        name: "Filter 3",
        namespace,
        operation: Operation.AND,
        groups: [demoGroup]
    };

    const filter3 = wrapQueryObjectIntoFilter(queryObject3);

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

        const repository = new FilterRepository(gateway, namespace);
        presenter = new AdvancedSearchPresenter(repository);
    });

    it("should create a presenter and list filters from the gateway", async () => {
        // let's load some filters
        await presenter.load();

        expect(gateway.list).toBeCalledTimes(1);

        expect(presenter.vm).toEqual({
            appliedQueryObject: null,
            currentQueryObject: null,
            feedbackVm: {
                isOpen: false,
                message: ""
            },
            managerVm: {
                isOpen: false,
                view: "LIST",
                isLoading: false,
                loadingLabel: "",
                filters: [
                    {
                        id: filter1.id,
                        name: filter1.name,
                        description: filter1.description,
                        createdOn: filter1.createdOn
                    },
                    {
                        id: filter2.id,
                        name: filter2.name,
                        description: "",
                        createdOn: filter2.createdOn
                    }
                ]
            },
            builderVm: {
                isOpen: false
            },
            saverVm: {
                isOpen: false,
                isLoading: false,
                loadingLabel: ""
            }
        });
    });

    it("should transition to loading state and then to list state", async () => {
        const loadPromise = presenter.load();

        expect(presenter.vm.managerVm).toMatchObject({
            isOpen: false,
            isLoading: true,
            loadingLabel: "Listing filters",
            view: "EMPTY",
            filters: []
        });

        await loadPromise;

        expect(presenter.vm.managerVm).toMatchObject({
            isOpen: false,
            isLoading: false,
            loadingLabel: "",
            view: "LIST"
        });
    });

    it("should be able to apply a filter via filterId", async () => {
        // let's load some filters
        await presenter.load();

        // Let's apply a filter
        await presenter.applyFilter("filter-1");

        expect(presenter.vm).toMatchObject({
            appliedQueryObject: queryObject1,
            currentQueryObject: null,
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

    it("should be able to apply directly a filter", async () => {
        // let's load some filters
        await presenter.load();

        // Let's apply a queryObject
        presenter.applyFilter(queryObject2);

        expect(presenter.vm).toMatchObject({
            appliedQueryObject: queryObject2,
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
            appliedQueryObject: null,
            currentQueryObject: null
        });
    });

    it("should be able to edit an already applied query object", async () => {
        // let's load some filters
        await presenter.load();

        // Let's apply and unset the filter
        await presenter.applyFilter("filter-1");
        presenter.editAppliedQueryObject();

        expect(presenter.vm).toMatchObject({
            appliedQueryObject: queryObject1,
            currentQueryObject: queryObject1,
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
            currentQueryObject: {
                id: "",
                name: "Draft filter",
                description: "",
                namespace,
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
            namespace,
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
        presenter.saveQueryObject(queryObject);
        expect(presenter.vm).toMatchObject({
            currentQueryObject: queryObject,
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
        const persistPromise = presenter.persistQueryObject(queryObject);

        // Let's check the transition to loading state
        expect(presenter.vm.saverVm).toMatchObject({
            isOpen: true,
            isLoading: true,
            loadingLabel: "Creating filter"
        });

        await persistPromise;

        expect(gateway.create).toBeCalledTimes(1);
        expect(gateway.create).toHaveBeenCalledWith({
            id: expect.any(String),
            name: "Draft filter",
            description: "",
            namespace,
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
            id: filter1.id,
            name: filter1.name,
            description: filter1.description,
            createdOn: filter1.createdOn
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
            currentQueryObject: queryObject1,
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
            ...queryObject1,
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
        presenter.saveQueryObject(queryObject);
        expect(presenter.vm).toMatchObject({
            currentQueryObject: queryObject,
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
        const persistPromise = presenter.persistQueryObject(queryObject);

        // Let's check the transition to loading state
        expect(presenter.vm.saverVm).toMatchObject({
            isOpen: true,
            isLoading: true,
            loadingLabel: "Updating filter"
        });

        await persistPromise;

        expect(gateway.update).toBeCalledTimes(1);
        expect(gateway.update).toHaveBeenCalledWith({
            id: "filter-1",
            name: "Filter 1",
            description: "Filter description",
            namespace,
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
            id: filter1.id,
            name: "Filter 1 - Edit",
            description: filter1.description,
            createdOn: filter1.createdOn
        });
    });

    it("should be able to rename a filter", async () => {
        // let's load some filters
        await presenter.load();

        // Let's open the filter manager
        presenter.openManager();
        expect(presenter.vm).toMatchObject({
            managerVm: {
                isOpen: true
            }
        });

        // Let's rename a filter
        await presenter.renameFilter("filter-1");

        expect(presenter.vm).toMatchObject({
            currentQueryObject: queryObject1,
            managerVm: {
                isOpen: false
            },
            builderVm: {
                isOpen: false
            },
            saverVm: {
                isOpen: true
            }
        });

        // Let's save it via the gateway
        const persistPromise = presenter.persistQueryObject({
            ...queryObject1,
            name: `${queryObject1.name} - Edit`
        });

        // Let's check the transition to loading state
        expect(presenter.vm.saverVm).toMatchObject({
            isOpen: true,
            isLoading: true,
            loadingLabel: "Updating filter"
        });

        await persistPromise;

        expect(gateway.update).toBeCalledTimes(1);
        expect(gateway.update).toHaveBeenCalledWith({
            id: "filter-1",
            name: `${filter1.name} - Edit`,
            description: "Filter description",
            namespace,
            operation: Operation.AND,
            groups: [JSON.stringify(queryObject1.groups[0])]
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
                message: `Filter "${queryObject1.name} - Edit" was successfully updated.`
            }
        });

        // Let's open the manager again and check if the new data is there.
        // Be aware: data comes from the mocked gateway
        presenter.openManager();
        expect(presenter.vm.managerVm.filters.length).toBe(2);
        expect(presenter.vm.managerVm.filters[0]).toEqual({
            id: filter1.id,
            name: `${filter1.name} - Edit`,
            description: filter1.description,
            createdOn: filter1.createdOn
        });
    });

    it("should be able to clone a filter", async () => {
        // let's load some filters
        await presenter.load();

        // Let's open the filter manager
        presenter.openManager();
        expect(presenter.vm).toMatchObject({
            managerVm: {
                isOpen: true
            }
        });

        // Let's clone a filter
        await presenter.cloneFilter("filter-1");

        const clonedQueryObject = {
            ...queryObject1,
            id: "",
            name: `Clone of ${queryObject1.name}`
        };

        expect(presenter.vm).toMatchObject({
            currentQueryObject: clonedQueryObject,
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

        presenter.saveQueryObject(clonedQueryObject);
        expect(presenter.vm).toMatchObject({
            currentQueryObject: clonedQueryObject,
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
        const persistPromise = presenter.persistQueryObject(clonedQueryObject);

        // Let's check the transition to loading state
        expect(presenter.vm.saverVm).toMatchObject({
            isOpen: true,
            isLoading: true,
            loadingLabel: "Creating filter"
        });

        await persistPromise;

        expect(gateway.create).toBeCalledTimes(1);
        expect(gateway.create).toHaveBeenCalledWith({
            id: expect.any(String),
            name: `Clone of ${filter1.name}`,
            description: "Filter description",
            namespace,
            operation: Operation.AND,
            groups: [JSON.stringify(queryObject1.groups[0])]
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
                message: `Filter "Clone of ${filter1.name}" was successfully created.`
            }
        });

        // Let's open the manager again and check if the new data is there
        presenter.openManager();
        expect(presenter.vm.managerVm.filters.length).toBe(3);
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
            currentQueryObject: null,
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
            id: filter2.id,
            name: filter2.name,
            description: "",
            createdOn: filter2.createdOn
        });
    });

    it("should be able to handle an empty list - error from the gateway", async () => {
        const message = "Gateway error while listing filters";
        const gateway = createMockGateway({
            list: jest.fn().mockRejectedValue(new Error(message))
        });

        const repository = new FilterRepository(gateway, namespace);
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

        const repository = new FilterRepository(createGateway, namespace);
        const presenter = new AdvancedSearchPresenter(repository);

        // Let's load some filters
        await presenter.load();

        // Let's try to save a QueryObject
        const queryObject = {
            id: "",
            name: "Draft filter",
            description: "",
            namespace,
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

        await presenter.persistQueryObject(queryObject);

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

        const repository = new FilterRepository(updateGateway, namespace);
        const presenter = new AdvancedSearchPresenter(repository);

        // Let's load some filters
        await presenter.load();

        // Let's try to save a QueryObject
        const queryObject = {
            ...queryObject1,
            name: queryObject1 + " - Edit"
        };

        await presenter.persistQueryObject(queryObject);

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

        const repository = new FilterRepository(updateGateway, namespace);
        const presenter = new AdvancedSearchPresenter(repository);

        // Let's load some filters
        await presenter.load();

        await presenter.deleteFilter(queryObject1.id);

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
            currentQueryObject: null,
            feedbackVm: {
                isOpen: true,
                message: "Any message"
            }
        });
    });
});
