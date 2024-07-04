import { Context } from "~/types";
import {
    IExportContentAssets,
    IExportContentAssetsInput,
    IExportContentAssetsOutput
} from "~/tasks/domain/abstractions/ExportContentAssets";
import { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { ICmsEntryFetcher } from "~/tasks/utils/cmsEntryFetcher";
import { IEntryAssets, IEntryAssetsList } from "~/tasks/utils/entryAssets";
import { ICmsAssetsZipper } from "~/tasks/utils/cmsAssetsZipper";
import { IZipCombiner } from "~/tasks/utils/zipCombiner";
import { IFileFetcher } from "~/tasks/utils/fileFetcher";

export interface ICreateCmsAssetsZipperCallableConfig {
    filename: string;
    entryFetcher: ICmsEntryFetcher;
    createEntryAssets: () => IEntryAssets;
    createEntryAssetsList: () => IEntryAssetsList;
    fileFetcher: IFileFetcher;
}

export interface ICreateCmsAssetsZipperCallable {
    (config: ICreateCmsAssetsZipperCallableConfig): ICmsAssetsZipper;
}

export interface ICreateZipCombinerCallableConfig {
    target: string;
}

export interface ICreateZipCombinerCallable {
    (config: ICreateZipCombinerCallableConfig): IZipCombiner;
}

export interface IExportContentAssetsParams {
    createCmsAssetsZipper: ICreateCmsAssetsZipperCallable;
    createZipCombiner: ICreateZipCombinerCallable;
}

export class ExportContentAssets<
    C extends Context = Context,
    I extends IExportContentAssetsInput = IExportContentAssetsInput,
    O extends IExportContentAssetsOutput = IExportContentAssetsOutput
> implements IExportContentAssets<C, I, O>
{
    private readonly createCmsAssetsZipper: ICreateCmsAssetsZipperCallable;
    private readonly createZipCombiner: ICreateZipCombinerCallable;

    public constructor(params: IExportContentAssetsParams) {
        this.createCmsAssetsZipper = params.createCmsAssetsZipper;
        this.createZipCombiner = params.createZipCombiner;
    }

    public async run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { response } = params;

        return response.done();
    }
}
