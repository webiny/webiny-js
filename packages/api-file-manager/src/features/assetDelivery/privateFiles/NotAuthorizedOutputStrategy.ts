import type { AssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply.js";
import { NotAuthorizedAssetReply } from "./NotAuthorizedAssetReply.js";
import type { IAssetOutputStrategy } from "../abstractions.js";

export class NotAuthorizedOutputStrategy implements IAssetOutputStrategy {
    async output(): Promise<AssetReply> {
        return new NotAuthorizedAssetReply();
    }
}
