import { plugins } from "@webiny/plugins";

import { IconPickerPlugin, Icon } from "./types";

type IconProps = {
    icon: Icon;
    size?: number;
};

export const IconRenderer = ({ icon, size = 32 }: IconProps) => {
    const iconPickerPlugins = plugins.byType<IconPickerPlugin>("admin-icon-picker");
    const plugin = iconPickerPlugins.find(plugin => plugin.iconType === icon.type);

    if (!plugin) {
        return null;
    }

    return plugin.renderIcon(icon, size);
};
