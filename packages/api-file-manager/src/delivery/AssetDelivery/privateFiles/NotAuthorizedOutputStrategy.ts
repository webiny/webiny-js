import { AssetOutputStrategy, AssetReply } from "~/delivery";
import { NotAuthorizedAssetReply } from "./NotAuthorizedAssetReply";

export class NotAuthorizedOutputStrategy implements AssetOutputStrategy {
    async output(): Promise<AssetReply> {
        return new NotAuthorizedAssetReply();
    }
}
