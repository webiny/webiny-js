import { TablePresenter } from "./TablePresenter";
import { ColumnConfig } from "~/config/table/Column";

interface Data {
    id: string;
    firstName: string;
    lastName: string;
}

const columnConfigs: ColumnConfig[] = [
    {
        name: "id",
        cell: "-",
        className: "id-className",
        header: "Id",
        hidable: false,
        resizable: false,
        size: 200,
        sortable: false,
        visible: true
    },
    {
        name: "firstName",
        cell: "-",
        className: "firstName-className",
        header: "First Name",
        hidable: false,
        resizable: false,
        size: 200,
        sortable: false,
        visible: true
    },
    {
        name: "lastName",
        cell: "-",
        className: "lastName-className",
        header: "Last Name",
        hidable: false,
        resizable: false,
        size: 200,
        sortable: false,
        visible: false
    }
];

const data: Data[] = [
    {
        id: "id-1",
        firstName: "John",
        lastName: "Doe"
    },
    {
        id: "id-2",
        firstName: "John",
        lastName: "Doe"
    }
];

describe("TablePresenter", () => {
    const cellRenderer = jest.fn();
    let presenter: TablePresenter<Data>;

    beforeEach(() => {
        jest.clearAllMocks();

        presenter = new TablePresenter(cellRenderer);
    });

    it("should load the presenter and set the right vm", () => {
        presenter.load({
            columns: columnConfigs,
            data,
            selected: [],
            namespace: "any-namespace",
            nameColumnId: "id"
        });

        expect(presenter.vm).toEqual({
            columns: {
                firstName: {
                    cell: expect.any(Function),
                    className: "firstName-className",
                    enableHiding: false,
                    enableResizing: false,
                    enableSorting: false,
                    header: "First Name",
                    size: 200
                },
                lastName: {
                    cell: expect.any(Function),
                    className: "lastName-className",
                    enableHiding: false,
                    enableResizing: false,
                    enableSorting: false,
                    header: "Last Name",
                    size: 200
                },
                id: {
                    cell: expect.any(Function),
                    className: "id-className",
                    enableHiding: false,
                    enableResizing: false,
                    enableSorting: false,
                    header: "Id",
                    size: 200
                }
            },
            columnVisibility: {
                firstName: true,
                id: true,
                lastName: false
            },
            selectedRows: [],
            initialSorting: [
                {
                    id: "savedOn",
                    desc: true
                }
            ]
        });
    });
});
