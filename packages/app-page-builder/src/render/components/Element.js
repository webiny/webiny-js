//@flow
import { getPlugins } from "@webiny/plugins";
import { withPageBuilder } from "@webiny/app-page-builder/context";
import type { PbElementType } from "@webiny/app-page-builder/types";

declare type ElementProps = {
    element: PbElementType,
    pageBuilder: Object
};

window.getPlugins = getPlugins;

const Element = ({ element, pageBuilder: { theme } }: ElementProps) => {
    if (!element) {
        return null;
    }

    const plugin = getPlugins("pb-render-page-element").find(pl => pl.elementType === element.type);

    if (!plugin) {
        return null;
    }

    return plugin.render({ theme, element });
};

export default withPageBuilder()(Element);
