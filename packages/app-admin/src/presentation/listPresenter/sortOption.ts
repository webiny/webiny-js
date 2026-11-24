import type { IListViewModel } from "./abstractions.js";

type Sort = NonNullable<IListViewModel<unknown>["sort"]>;

/** The list's sort as a select option value: `name_ASC`, or "" when the list is unsorted. */
export function toSortOption(sort: IListViewModel<unknown>["sort"]): string {
    if (!sort) {
        return "";
    }
    return `${sort.field}_${sort.direction}`;
}

/** Reads a select option value made by `toSortOption` back into a sort. */
export function fromSortOption(value: string): Sort {
    const separator = value.lastIndexOf("_");
    const field = value.slice(0, separator);
    const direction = value.slice(separator + 1) === "ASC" ? "ASC" : "DESC";
    return { field, direction };
}
