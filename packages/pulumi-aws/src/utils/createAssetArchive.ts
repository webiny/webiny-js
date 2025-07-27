import * as pulumi from "@pulumi/pulumi";

export const createAssetArchive = (target: string) => {
    return new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive(target)
    });
};
