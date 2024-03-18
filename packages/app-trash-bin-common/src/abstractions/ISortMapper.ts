import { SortDTO } from "~/domain";

export type DbSort = `${string}_ASC` | `${string}_DESC`;

export interface ColumnSort {
    id: string;
    desc: boolean;
}

export interface ISortMapper {
    fromDbToDTO: (data: DbSort) => SortDTO;
    fromColumnToDTO: (data: ColumnSort) => SortDTO;
}
