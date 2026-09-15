import { AssetType } from "../../abstractions/AssetType.js";
import { SUPPORTED_TRANSFORMABLE_IMAGES } from "./utils.js";
import { ImageAssetTypeHandler } from "./ImageAssetTypeHandler.js";

class ImageAssetTypeImpl implements AssetType.Interface {
    canHandle(asset: AssetType.Asset): boolean {
        return SUPPORTED_TRANSFORMABLE_IMAGES.includes(asset.getExtension());
    }

    getHandlerAbstraction() {
        return ImageAssetTypeHandler;
    }
}

export const ImageAssetType = AssetType.createImplementation({
    implementation: ImageAssetTypeImpl,
    dependencies: []
});
