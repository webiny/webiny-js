import { Folder, FolderDtoMapper } from "@webiny/app-aco";
import { Page, PageDtoMapper } from "~/domain/Page/index.js";
import type { WbIdentity } from "~/types.js";
import { CmsIdentity } from "@webiny/app-headless-cms-common/types/shared.js";

export interface DocumentDto {
    id: string;
    $type: "DOCUMENT" | "FOLDER";
    $selectable: boolean;
    title: string;
    createdBy: WbIdentity;
    savedBy: WbIdentity;
    createdOn: string;
    savedOn: string;
    data: Record<string, any>;
}

export class DocumentListMapper {
    static fromPage(page: Page): DocumentDto {
        return {
            id: page.id,
            $type: "DOCUMENT",
            $selectable: true,
            title: page.properties.title ?? "",
            createdBy: this.getIdentity(page.createdBy),
            createdOn: page.createdOn,
            savedBy: this.getIdentity(page.savedBy),
            savedOn: page.savedOn,
            data: PageDtoMapper.toDTO(page)
        };
    }

    static fromFolder(folder: Folder): DocumentDto {
        return {
            id: folder.id,
            $type: "FOLDER",
            $selectable: false,
            title: folder.title,
            createdBy: this.getIdentity(folder.createdBy),
            createdOn: folder.createdOn || "",
            savedBy: this.getIdentity(folder.savedBy),
            savedOn: folder.savedOn || "",
            data: FolderDtoMapper.toDTO(folder)
        };
    }

    private static getIdentity(identity: WbIdentity | CmsIdentity | undefined | null): WbIdentity {
        return {
            id: identity?.id || "",
            displayName: identity?.displayName || "",
            type: identity?.type || ""
        };
    }
}
