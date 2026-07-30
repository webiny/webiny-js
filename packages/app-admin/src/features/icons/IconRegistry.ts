import { ReactComponent as AutoAwesomeIcon } from "@webiny/icons/auto_awesome.svg";
import { ReactComponent as BoltIcon } from "@webiny/icons/bolt.svg";
import { ReactComponent as CheckCircleIcon } from "@webiny/icons/check_circle.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as DiscountIcon } from "@webiny/icons/discount.svg";
import { ReactComponent as DownloadIcon } from "@webiny/icons/download.svg";
import { ReactComponent as PublishIcon } from "@webiny/icons/publish.svg";
import { ReactComponent as SellIcon } from "@webiny/icons/sell.svg";
import { ReactComponent as SendIcon } from "@webiny/icons/send.svg";
import { ReactComponent as StarIcon } from "@webiny/icons/star.svg";
import { ReactComponent as VisibilityIcon } from "@webiny/icons/visibility.svg";
import { IconRegistry as Abstraction, type IconComponent } from "./abstractions.js";

/**
 * Pre-seeded with a handful of `@webiny/icons` SVGs already used across the admin app, so
 * common string keys resolve out of the box. Register more via `registerIcon(container, ...)`.
 */
class IconRegistryImpl implements Abstraction.Interface {
    private readonly icons = new Map<string, IconComponent>();

    constructor() {
        this.register("auto_awesome", AutoAwesomeIcon);
        this.register("bolt", BoltIcon);
        this.register("check_circle", CheckCircleIcon);
        this.register("delete", DeleteIcon);
        this.register("discount", DiscountIcon);
        this.register("download", DownloadIcon);
        this.register("publish", PublishIcon);
        this.register("sell", SellIcon);
        this.register("send", SendIcon);
        this.register("star", StarIcon);
        this.register("visibility", VisibilityIcon);
    }

    register(key: string, component: IconComponent): void {
        this.icons.set(key, component);
    }

    get(key: string): IconComponent | undefined {
        const component = this.icons.get(key);
        if (!component && process.env.NODE_ENV !== "production") {
            console.warn(
                `[IconRegistry] No icon registered for key "${key}". ` +
                    `Register it via registerIcon(container, "${key}", Component) or pass a React element instead.`
            );
        }
        return component;
    }
}

export const IconRegistry = Abstraction.createImplementation({
    implementation: IconRegistryImpl,
    dependencies: []
});
