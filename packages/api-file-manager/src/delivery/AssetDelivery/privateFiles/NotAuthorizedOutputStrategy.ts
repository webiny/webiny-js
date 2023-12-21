import { AssetOutputStrategy, AssetReply } from "~/delivery";
import { NotAuthorizedReply } from "./NotAuthorizedReply";

export class NotAuthorizedOutputStrategy implements AssetOutputStrategy {
    async output(): Promise<AssetReply> {
        return new NotAuthorizedReply();
    }
}
