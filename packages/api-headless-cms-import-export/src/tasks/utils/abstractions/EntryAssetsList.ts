import { IAssets } from "~/tasks/utils/abstractions/EntryAssets";

export interface IAssetItem {
    id: string;
    key: string;
    aliases: string[];
}

export interface IEntryAssetsList {
    fetch(input: IAssets): Promise<IAssetItem[]>;
}
