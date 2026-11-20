import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { ListPresenter } from "~/presentation/listPresenter/abstractions.js";
import { ListPresenter as ListPresenterImpl } from "~/presentation/listPresenter/ListPresenter.js";
import { AssistantPageContext } from "~/features/assistantPageContext/abstractions.js";
import { AssistantPageContext as AssistantPageContextImpl } from "~/features/assistantPageContext/AssistantPageContext.js";
import type { IDataSource } from "~/presentation/listPresenter/abstractions.js";
import { TrashBinBulkActionGateway } from "./abstractions.js";
import { TrashBinDeleteGateway } from "./abstractions.js";
import { TrashBinListGateway } from "./abstractions.js";
import { TrashBinPresenter as Abstraction } from "./abstractions.js";
import { TrashBinRestoreGateway } from "./abstractions.js";
import type { TrashBinItem } from "./abstractions.js";
import { TrashBinPresenter } from "./TrashBinPresenter.js";

function item(id: string): TrashBinItem {
    return {
        id,
        title: `Item ${id}`,
        location: { folderId: undefined },
        createdBy: { id: "u1", displayName: "User", type: "admin" },
        deletedBy: { id: "u1", displayName: "User", type: "admin" },
        deletedOn: "2026-10-16T10:00:00.000Z"
    } as unknown as TrashBinItem;
}

async function setup(deleteResult: boolean) {
    const container = new Container();
    const listPresenter = {
        init: vi.fn((_config: { dataSource: IDataSource<TrashBinItem> }) => undefined),
        vm: {},
        actions: {}
    };
    const deleteGateway = { execute: vi.fn(async (_id: string) => deleteResult) };

    container.registerInstance(ListPresenter, listPresenter as unknown as ListPresenter.Interface);
    container.registerInstance(TrashBinListGateway, {
        execute: vi.fn(async () => ({
            data: [item("a"), item("b")],
            meta: { cursor: null, hasMoreItems: false, totalCount: 2 }
        }))
    });
    container.registerInstance(TrashBinDeleteGateway, deleteGateway);
    container.registerInstance(TrashBinRestoreGateway, { execute: vi.fn() });
    container.registerInstance(TrashBinBulkActionGateway, { execute: vi.fn() });
    container.register(TrashBinPresenter).inSingletonScope();

    const presenter = container.resolve(Abstraction);
    presenter.init({ nameColumnId: "title" });
    const dataSource = listPresenter.init.mock.calls[0][0].dataSource;
    await dataSource.query({});

    return { presenter, deleteGateway, dataSource };
}

describe("TrashBinPresenter.deleteItem", () => {
    it("removes the row and returns true when the gateway deleted the item", async () => {
        const { presenter, deleteGateway, dataSource } = await setup(true);

        const result = await presenter.actions.deleteItem("a");

        expect(result).toBe(true);
        expect(deleteGateway.execute).toHaveBeenCalledWith("a");
        expect(dataSource.rows.map(row => row.id)).toEqual(["b"]);
    });

    it("keeps the row and returns false when the gateway returned false", async () => {
        const { presenter, dataSource } = await setup(false);

        const result = await presenter.actions.deleteItem("a");

        expect(result).toBe(false);
        expect(dataSource.rows.map(row => row.id)).toEqual(["a", "b"]);
    });
});

describe("TrashBinPresenter assistant page context", () => {
    const setupWithList = () => {
        const container = new Container();
        container.register(AssistantPageContextImpl).inSingletonScope();
        container.register(ListPresenterImpl);
        container.registerInstance(TrashBinListGateway, {
            execute: vi.fn(async () => ({
                data: [item("a"), item("b")],
                meta: { cursor: null, hasMoreItems: false, totalCount: 2 }
            }))
        });
        container.registerInstance(TrashBinDeleteGateway, { execute: vi.fn() });
        container.registerInstance(TrashBinRestoreGateway, { execute: vi.fn() });
        container.registerInstance(TrashBinBulkActionGateway, { execute: vi.fn() });
        container.register(TrashBinPresenter).inSingletonScope();

        return {
            presenter: container.resolve(Abstraction),
            pageContext: container.resolve(AssistantPageContext)
        };
    };

    it("tells the assistant whose trash is open and what is in it, until disposed", async () => {
        const { presenter, pageContext } = setupWithList();

        presenter.init({
            nameColumnId: "title",
            assistant: {
                view: 'Deleted entries of the "Product" content model in Headless CMS',
                details: { modelId: "product" }
            }
        });

        await vi.waitFor(() => {
            expect(pageContext.get()?.details["visibleRows"]).toEqual([
                { id: "a", title: "Item a" },
                { id: "b", title: "Item b" }
            ]);
        });
        expect(pageContext.get()?.view).toBe(
            'Deleted entries of the "Product" content model in Headless CMS'
        );
        expect(pageContext.get()?.details).toMatchObject({ modelId: "product", totalCount: 2 });

        presenter.dispose();
        expect(pageContext.get()).toBeNull();
    });

    it("tells the assistant nothing when the caller gives no description", () => {
        const { presenter, pageContext } = setupWithList();

        presenter.init({ nameColumnId: "title" });

        expect(pageContext.get()).toBeNull();
    });
});
