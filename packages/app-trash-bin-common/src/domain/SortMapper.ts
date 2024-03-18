import { DbSort, ColumnSort } from "~/abstractions";
import { SortDTO } from "~/domain/Sort";

export class SortMapper {
    static fromColumnToDTO(data: ColumnSort): SortDTO {
        const { id, desc } = data;

        return {
            field: id,
            order: desc ? "desc" : "asc"
        };
    }

    static fromDTOtoColumn(data: SortDTO): ColumnSort {
        const { field, order } = data;

        return {
            id: field,
            desc: order === "desc"
        };
    }

    static fromDTOtoDb(data: SortDTO): DbSort {
        const { field, order } = data;

        if (order === "asc") {
            return `${field}_ASC`;
        }

        return `${field}_DESC`;
    }
}
