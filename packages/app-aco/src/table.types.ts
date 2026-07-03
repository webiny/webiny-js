import type { FolderDto } from "~/domain/folder/FolderDto.js";
import type { FolderIdentityDto } from "~/domain/folder/FolderIdentity.js";
import type { GenericSearchData, Location } from "~/types.js";

export type { TableRow, RecordTableRow } from "@webiny/app-admin/components/Table/table.types.js";
import type { TableRow } from "@webiny/app-admin/components/Table/table.types.js";

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

export interface FolderTableRow extends TableRow<FolderDto> {
    $type: "FOLDER";
}
