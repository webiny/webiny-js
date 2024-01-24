import { ColumnsVisibilityPresenter } from "./ColumnsVisibilityPresenter";
import { IColumnsVisibilityGateway } from "../gateways";
import { ColumnConfig } from "~/config/table/Column";
import { Column, ColumnsPresenter, ColumnsRepository } from "../Columns";
import { ColumnsVisibilityRepository } from "./ColumnsVisibilityRepository";
import { ColumnsVisibilityDecorator } from "./ColumnsVisibilityDecorator";
import { ColumnsVisibilityUpdater } from "~/components/Table/components/Table/ColumnVisibility/ColumnsVisibilityUpdater";

const defaultGateway: IColumnsVisibilityGateway = {
    get: jest.fn(),
    set: jest.fn()
};

const createMockGateway = ({
    get,
    set
}: Partial<IColumnsVisibilityGateway>): IColumnsVisibilityGateway => ({
    ...defaultGateway,
    ...(get && { get }),
    ...(set && { set })
});

describe("ColumnsVisibilityPresenter", () => {
    const columnConfigs: ColumnConfig[] = [
        {
            cell: "Id Cell Content",
            className: "id-class",
            header: "Id",
            hideable: true,
            name: "id",
            resizable: true,
            size: 200,
            sortable: true,
            visible: true
        },
        {
            cell: "Title Cell Content",
            className: "title-class",
            header: "Title",
            hideable: true,
            name: "title",
            resizable: true,
            size: 200,
            sortable: true,
            visible: true
        },
        {
            cell: "Date Cell Content",
            className: "date-class",
            header: "Date",
            hideable: true,
            name: "date",
            resizable: true,
            size: 200,
            sortable: true,
            visible: false
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return the columns visibility from the column config", async () => {
        // Let's create repositories and presenters
        const columnsRepo = new ColumnsRepository(
            columnConfigs.map(config => Column.createFromConfig(config))
        );
        const visibilityRepo = new ColumnsVisibilityRepository(defaultGateway);
        const repo = new ColumnsVisibilityDecorator(visibilityRepo, columnsRepo);

        const columnsPresenter = new ColumnsPresenter(repo);
        const columnsVisibilityPresenter = new ColumnsVisibilityPresenter(columnsPresenter);

        // Let's init the ColumnsPresenter
        await columnsPresenter.init();

        expect(defaultGateway.get).toBeCalledTimes(1);

        expect(columnsVisibilityPresenter.vm).toEqual({
            columnsVisibility: {
                id: true,
                title: true,
                date: false
            }
        });
    });

    it("should return the columns visibility from both the column configs and the gateway", async () => {
        // Let's create a mocked gateway
        const gateway = createMockGateway({
            get: jest.fn().mockImplementation(() => ({ title: false }))
        });

        // Let's create repositories and presenters
        const columnsRepo = new ColumnsRepository(
            columnConfigs.map(config => Column.createFromConfig(config))
        );
        const visibilityRepo = new ColumnsVisibilityRepository(gateway);
        const repo = new ColumnsVisibilityDecorator(visibilityRepo, columnsRepo);

        const columnsPresenter = new ColumnsPresenter(repo);
        const columnsVisibilityPresenter = new ColumnsVisibilityPresenter(columnsPresenter);

        // Let's init the ColumnsPresenter
        await columnsPresenter.init();

        expect(gateway.get).toBeCalledTimes(1);

        expect(columnsVisibilityPresenter.vm).toEqual({
            columnsVisibility: {
                id: true,
                title: false, // title is defined true in the config, but defined false in the gateway
                date: false
            }
        });
    });

    it("should be able to update the visibility via `ColumnsVisibilityUpdater`", async () => {
        // Let's create repositories and presenters
        const columnsRepo = new ColumnsRepository(
            columnConfigs.map(config => Column.createFromConfig(config))
        );
        const visibilityRepo = new ColumnsVisibilityRepository(defaultGateway);
        const repo = new ColumnsVisibilityDecorator(visibilityRepo, columnsRepo);

        const columnsPresenter = new ColumnsPresenter(repo);
        const columnsVisibilityPresenter = new ColumnsVisibilityPresenter(columnsPresenter);

        // Let's create ColumnsVisibilityUpdater
        const columnsVisibilityUpdater = new ColumnsVisibilityUpdater(visibilityRepo);

        // Let's init the ColumnsPresenter
        await columnsPresenter.init();

        // Let's check the initial state
        const initial = columnsVisibilityPresenter.vm.columnsVisibility;
        expect(initial).toEqual({
            id: true,
            title: true,
            date: false
        });

        // Let's update the visibility
        const updater = jest.fn().mockImplementation(current => ({ ...current, title: false }));
        await columnsVisibilityUpdater.update(updater);

        expect(columnsVisibilityPresenter.vm).toEqual({
            columnsVisibility: {
                id: true,
                title: false,
                date: false
            }
        });
    });
});
