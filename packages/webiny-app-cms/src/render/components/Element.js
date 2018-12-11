//@flow
import { getPlugins } from "webiny-plugins";
import { withCms } from "webiny-app-cms/context";
import type { ElementType } from "webiny-app-cms/types";

declare type ElementProps = {
    element: ElementType,
    cms: Object
};

const Element = ({ element, cms: { theme } }: ElementProps) => {
    if (!element) {
        return null;
    }

    const plugin = getPlugins("cms-render-element").find(pl => pl.element === element.type);

    if (!plugin) {
        return null;
    }

    return plugin.render({ theme, element });
};

export default withCms()(Element);
