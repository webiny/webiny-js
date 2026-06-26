import type { AssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply.js";
import { NotAuthorizedAssetReply } from "./NotAuthorizedAssetReply.js";
import { AssetOutputStrategy } from "../abstractions/AssetOutputStrategy.js";

export class NotAuthorizedOutputStrategy implements AssetOutputStrategy.Interface {
    async output(): Promise<AssetReply> {
        return new NotAuthorizedAssetReply();
    }
}
