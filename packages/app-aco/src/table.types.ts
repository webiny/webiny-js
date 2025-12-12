import type { FolderDto } from "~/domain/folder/FolderDto.js";
import type { FolderIdentityDto } from "~/domain/folder/FolderIdentity.js";
import type { GenericSearchData, Location } from "~/types.js";

export interface SearchRecordItem<TData extends GenericSearchData = GenericSearchData> {
    id: string;
    type: string;
    title: string;
    content: string;
    location: Location;
    data: TData;
    tags: string[];
    createdOn: string;
    createdBy: FolderIdentityDto;
    savedOn: string;
    savedBy: FolderIdentityDto;
    modifiedOn: string | null;
    modifiedBy: FolderIdentityDto | null;
}

export type MovableSearchRecordItem = Pick<SearchRecordItem, "id" | "location">;

export type DeletableSearchRecordItem = Pick<SearchRecordItem, "id" | "location">;

export interface TableRow<TData = unknown> {
    id: string;
    $selectable: boolean;
    $type: string;
    data: TData;
}

export interface FolderTableRow extends TableRow<FolderDto> {
    $type: "FOLDER";
}

export interface RecordTableRow<TData> extends TableRow<TData> {
    $type: "RECORD";
}
