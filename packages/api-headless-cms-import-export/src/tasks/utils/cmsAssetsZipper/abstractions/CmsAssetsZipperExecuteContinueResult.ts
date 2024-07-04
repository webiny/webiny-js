export interface ICmsAssetsZipperExecuteContinueResult {
    key: string;
    url: string;
    bucket: string;
    expiresOn: Date;
    entryCursor: string | undefined;
    fileCursor: string | undefined;
}
