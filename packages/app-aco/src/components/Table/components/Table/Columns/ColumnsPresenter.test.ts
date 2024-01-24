import { ColumnsPresenter } from "./ColumnsPresenter";
import { Column } from "./Column";
import { ColumnConfig } from "~/config/table/Column";
import { ColumnsRepository } from "./ColumnsRepository";

describe("ColumnsPresenter", () => {
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
            hideable: false,
            name: "title",
            resizable: false,
            size: 100,
            sortable: false,
            visible: false
        }
    ];

    let presenter: ColumnsPresenter;

    beforeEach(() => {
        jest.clearAllMocks();
        const repository = new ColumnsRepository(
            columnConfigs.map(config => Column.createFromConfig(config))
        );
        presenter = new ColumnsPresenter(repository);
    });

    it("should `init` and return the columns via `vm`", () => {
        presenter.init();

        expect(presenter.vm).toEqual({
            columns: [
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
                    hideable: false,
                    name: "title",
                    resizable: false,
                    size: 100,
                    sortable: false,
                    visible: false
                }
            ]
        });
    });
});
