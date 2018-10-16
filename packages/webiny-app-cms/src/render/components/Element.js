//@flow
import { getPlugins } from "webiny-app/plugins";
import { withTheme } from "webiny-app-cms/theme";
import type { ElementType } from "webiny-app-cms/types";

declare type ElementProps = {
    element: ElementType,
    theme: Object
};

const Element = ({ element, theme }: ElementProps) => {
    if (!element) {
        return null;
    }

    const plugin = getPlugins("cms-render-element").find(pl => pl.element === element.type);

    if (!plugin) {
        return null;
    }

    return plugin.render({ theme, element });
};

export default withTheme()(Element);
