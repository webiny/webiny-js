import { getPlugins } from "@webiny/plugins";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { PbElement, PbRenderElementPlugin } from "@webiny/app-page-builder/types";

declare type ElementProps = {
    element: PbElement;
};

const Element: React.FC<ElementProps> = ({ element }) => {
    const { theme } = usePageBuilder();

    if (!element) {
        return null;
    }

    const plugin = getPlugins("pb-render-page-element").find(
        (pl: PbRenderElementPlugin) => pl.elementType === element.type
    ) as PbRenderElementPlugin;

    if (!plugin) {
        return null;
    }

    return plugin.render({ theme, element });
};

export default Element;
