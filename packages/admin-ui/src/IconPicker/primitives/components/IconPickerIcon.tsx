import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";

interface IconPickerIconProps extends React.HTMLAttributes<HTMLDivElement> {
    name: IconName;
    prefix: IconPrefix;
}

const IconPickerIcon = ({ name, prefix, ...props }: IconPickerIconProps) => {
    return (
        <div {...props}>
            <FontAwesomeIcon icon={[prefix, name]} size={"2x"} className={"block size-full!"} />
        </div>
    );
};

export { IconPickerIcon, type IconPickerIconProps };
