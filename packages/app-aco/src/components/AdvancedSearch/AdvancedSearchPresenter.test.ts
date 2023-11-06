import { AdvancedSearchPresenter } from "./AdvancedSearchPresenter";
import {
    FilterDTO,
    FilterGroupDTO,
    FilterGroupFilterDTO,
    FilterRepository,
    Operation
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

describe("AdvancedSearchPresenter", () => {
    const namespace = "namespace";

    const demoFilter: FilterGroupFilterDTO = {
        field: "any-field",
        value: "any-value",
        condition: "any-condition"
    };

    const demoGroup: FilterGroupDTO = {
        operation: Operation.AND,
        filters: [demoFilter]
    };

    const filter1: FilterDTO = {
        id: "filter-1",
        name: "Filter 1",
        description: "Filter description",
        operation: Operation.AND,
        groups: [demoGroup],
        createdOn: new Date().toString()
    };

    const filter2: FilterDTO = {
        id: "filter-2",
        name: "Filter 2",
        operation: Operation.AND,
        groups: [demoGroup],
        createdOn: new Date().toString()
    };

    const gateway = createMockGateway({
        list: jest.fn().mockImplementation(() => {
            return Promise.resolve([filter1, filter2]);
        }),
        get: jest.fn().mockImplementation(() => {
            return Promise.resolve(filter1);
        }),
        create: jest.fn().mockImplementation(() => {
            return Promise.resolve(filter1);
        }),
        update: jest.fn().mockImplementation(() => {
            return Promise.resolve({ ...filter1, name: "Filter 1 - Edit" });
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
            appliedFilter: null,
            currentFilter: null,
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

    it("should be able to apply directly a filter", async () => {
        // let's load some filters
        await presenter.load();

        // Let's apply a filter
        presenter.applyFilter(filter2);

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

        // Let's change the Filter and open the saver
        const filter = {
            id: "",
            name: "Draft filter",
            description: "",
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
        presenter.saveFilter(filter);
        expect(presenter.vm).toMatchObject({
            currentFilter: filter,
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
        const persistPromise = presenter.persistFilter(filter);

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
            groups: [filter.groups[0]]
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

        // Let's change the Filter and open the saver
        const filter = {
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
        presenter.saveFilter(filter);
        expect(presenter.vm).toMatchObject({
            currentFilter: filter,
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
        const persistPromise = presenter.persistFilter(filter);

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
            operation: Operation.AND,
            groups: [filter.groups[0]]
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
            currentFilter: filter1,
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
        const persistPromise = presenter.persistFilter({
            ...filter1,
            name: `${filter1.name} - Edit`
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
            operation: Operation.AND,
            groups: [filter1.groups[0]]
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
                message: `Filter "${filter1.name} - Edit" was successfully updated.`
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

        const clonedFilter = {
            ...filter1,
            id: "",
            name: `Clone of ${filter1.name}`
        };

        expect(presenter.vm).toMatchObject({
            currentFilter: clonedFilter,
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

        presenter.saveFilter(clonedFilter);
        expect(presenter.vm).toMatchObject({
            currentFilter: clonedFilter,
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
        const persistPromise = presenter.persistFilter(clonedFilter);

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
            groups: [filter1.groups[0]]
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

        // Let's try to save a Filter
        const filter = {
            id: "",
            name: "Draft filter",
            description: "",
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

        await presenter.persistFilter(filter);

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

        // Let's try to save a Filter
        const filter = {
            ...filter1,
            name: filter1 + " - Edit"
        };

        await presenter.persistFilter(filter);

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
