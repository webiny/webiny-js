import type { Page } from "~/domain/Page/index.js";
import { PageDtoMapper } from "~/domain/Page/index.js";
import { TableRowMapper as Abstraction } from "./abstractions.js";

class TableRowMapperImpl implements Abstraction.Interface {
    fromPage(page: Page): Abstraction.TableRow {
        return {
            id: page.entryId,
            $type: "RECORD",
            $selectable: true,
            data: PageDtoMapper.toDTO(page)
        };
    }
}

export const TableRowMapper = Abstraction.createImplementation({
    implementation: TableRowMapperImpl,
    dependencies: []
});
