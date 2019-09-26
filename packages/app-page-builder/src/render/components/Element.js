//@flow
import { getPlugins } from "@webiny/plugins";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import type { PbElementType } from "@webiny/app-page-builder/types";

declare type ElementProps = {
    element: PbElementType,
    pageBuilder: Object
};

const Element = ({ element }: ElementProps) => {
    const { theme } = usePageBuilder();

    if (!element) {
        return null;
    }

    const plugin = getPlugins("pb-render-page-element").find(pl => pl.elementType === element.type);

    if (!plugin) {
        return null;
    }

    return plugin.render({ theme, element });
};

export default Element;
