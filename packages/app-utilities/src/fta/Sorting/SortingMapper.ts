import { SortingDTO } from "./Sorting";

export type DbSorting = `${string}_ASC` | `${string}_DESC`;

export interface ColumnSorting {
    id: string;
    desc: boolean;
}

export class SortingMapper {
    static fromColumnToDTO(data: ColumnSorting): SortingDTO {
        const { id, desc } = data;

        return {
            field: id,
            order: desc ? "desc" : "asc"
        };
    }

    static fromDTOtoColumn(data: SortingDTO): ColumnSorting {
        const { field, order } = data;

        return {
            id: field,
            desc: order === "desc"
        };
    }

    static fromDTOtoDb(data: SortingDTO): DbSorting {
        const { field, order } = data;

        if (order === "asc") {
            return `${field}_ASC`;
        }

        return `${field}_DESC`;
    }
}
