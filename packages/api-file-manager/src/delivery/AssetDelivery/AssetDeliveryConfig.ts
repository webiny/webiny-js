import { Plugin } from "@webiny/plugins";
import { AssetRequestResolver } from "./abstractions/AssetRequestResolver";
import { AssetResolver } from "./abstractions/AssetResolver";
import { AssetTransformer } from "./abstractions/AssetTransformer";
import { FileManagerContext } from "~/types";
import { AssetOutput } from "./abstractions/AssetOutput";

type Setter<T extends any[]> = T extends [...any, infer TLast] ? (...args: T) => TLast : never;

type ImageResizeWidthsSetter = Setter<[number[]]>;
type AssetRequestResolverDecorator = Setter<[AssetRequestResolver]>;
type AssetResolverDecorator = Setter<[AssetResolver]>;
type AssetTransformerDecorator = Setter<[FileManagerContext, AssetTransformer]>;
type AssetOutputDecorator = Setter<[FileManagerContext, AssetOutput]>;

export class AssetDeliveryConfigBuilder {
    private baseConfig: AssetDeliveryConfig;
    private imageResizeWidths: ImageResizeWidthsSetter[] = [];
    private requestResolverDecorators: AssetRequestResolverDecorator[] = [];
    private assetResolverDecorators: AssetResolverDecorator[] = [];
    private assetTransformerDecorators: AssetTransformerDecorator[] = [];
    private assetOutputDecorators: AssetOutputDecorator[] = [];

    constructor(baseConfig: AssetDeliveryConfig) {
        this.baseConfig = baseConfig;
    }

    setImageResizeWidths(setter: ImageResizeWidthsSetter) {
        this.imageResizeWidths.push(setter);
    }

    decorateRequestResolver(decorator: AssetRequestResolverDecorator) {
        this.requestResolverDecorators.push(decorator);
    }

    decorateAssetResolver(decorator: AssetResolverDecorator) {
        this.assetResolverDecorators.push(decorator);
    }

    decorateAssetTransformer(decorator: AssetTransformerDecorator) {
        this.assetTransformerDecorators.push(decorator);
    }

    decorateAssetOutput(decorator: AssetOutputDecorator) {
        this.assetOutputDecorators.push(decorator);
    }

    /**
     * @internal
     */
    getImageResizeWidths() {
        return this.imageResizeWidths.reduce(
            (value, decorator) => decorator(value),
            this.baseConfig.getImageResizeWidths()
        );
    }

    /**
     * @internal
     */
    getAssetRequestResolver() {
        return this.requestResolverDecorators.reduce(
            (value, decorator) => decorator(value),
            this.baseConfig.getAssetRequestResolver()
        );
    }

    /**
     * @internal
     */
    getAssetResolver() {
        return this.assetResolverDecorators.reduce(
            (value, decorator) => decorator(value),
            this.baseConfig.getAssetResolver()
        );
    }

    /**
     * @internal
     */
    getAssetTransformer(context: FileManagerContext) {
        return this.assetTransformerDecorators.reduce(
            (value, decorator) => decorator(context, value),
            this.baseConfig.getAssetTransformer()
        );
    }

    /**
     * @internal
     */
    getAssetOutput(context: FileManagerContext) {
        return this.assetOutputDecorators.reduce(
            (value, decorator) => decorator(context, value),
            this.baseConfig.getAssetOutput()
        );
    }
}

interface AssetDeliveryConfigProps {
    imageResizeWidths: number[];
    assetRequestResolver: AssetRequestResolver;
    assetResolver: AssetResolver;
    assetTransformer: AssetTransformer;
    assetOutput: AssetOutput;
}

export class AssetDeliveryConfig {
    private props: AssetDeliveryConfigProps;

    constructor(props: AssetDeliveryConfigProps) {
        this.props = props;
    }

    getImageResizeWidths() {
        return this.props.imageResizeWidths;
    }

    getAssetRequestResolver() {
        return this.props.assetRequestResolver;
    }

    getAssetResolver() {
        return this.props.assetResolver;
    }

    getAssetTransformer() {
        return this.props.assetTransformer;
    }

    getAssetOutput() {
        return this.props.assetOutput;
    }
}

interface AssetDeliveryConfigModifierCallable {
    (config: AssetDeliveryConfigBuilder): Promise<void> | void;
}

export class AssetDeliveryConfigModifierPlugin extends Plugin {
    public static override type = "fm.config-modifier";
    private readonly cb: AssetDeliveryConfigModifierCallable;

    constructor(cb: AssetDeliveryConfigModifierCallable) {
        super();
        this.cb = cb;
    }

    async buildConfig(configBuilder: AssetDeliveryConfigBuilder): Promise<void> {
        await this.cb(configBuilder);
    }
}

export const createAssetDeliveryConfig = (cb: AssetDeliveryConfigModifierCallable) => {
    return new AssetDeliveryConfigModifierPlugin(cb);
};
