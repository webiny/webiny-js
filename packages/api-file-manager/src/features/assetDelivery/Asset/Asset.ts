import { Asset } from "~/delivery/AssetDelivery/Asset.js";
import { AssetFactory as AssetFactoryAbstraction, type IAssetFactory } from "./abstractions.js";

class AssetFactoryImpl implements IAssetFactory {
    create(data: AssetFactoryAbstraction.AssetData): AssetFactoryAbstraction.Asset {
        return Asset.create(data);
    }
}

export const AssetFactory = AssetFactoryAbstraction.createImplementation({
    implementation: AssetFactoryImpl,
    dependencies: []
});
