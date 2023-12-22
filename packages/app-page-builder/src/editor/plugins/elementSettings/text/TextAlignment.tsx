import React from "react";
import { css } from "emotion";
import classNames from "classnames";
import { Tooltip } from "@webiny/ui/Tooltip";
import { IconButton } from "@webiny/ui/Button";
import { PbEditorPageElementSettingsRenderComponentProps } from "../../../../types";
// Components
import { ContentWrapper } from "../components/StyledComponents";
// Icons
import { ReactComponent as AlignTextLeftIcon } from "../align/icons/format_align_left.svg";
import { ReactComponent as AlignTextCenterIcon } from "../align/icons/format_align_center.svg";
import { ReactComponent as AlignTextRightIcon } from "../align/icons/format_align_right.svg";
import { ReactComponent as AlignTextJustifyIcon } from "../align/icons/format_align_justify.svg";

const classes = {
    activeIcon: css({
        "&.mdc-icon-button": {
            color: "var(--mdc-theme-primary)"
        }
    }),
    icon: css({
        "&.mdc-icon-button": {
            color: "var(--mdc-theme-text-primary-on-background)"
        }
    })
};

type IconsType = {
    [key: string]: React.ReactElement;
};
// Icons map for dynamic render
const icons: IconsType = {
    left: <AlignTextLeftIcon />,
    center: <AlignTextCenterIcon />,
    right: <AlignTextRightIcon />,
    justify: <AlignTextJustifyIcon />
};

const alignments = Object.keys(icons);

type AlignTypesType = "left" | "center" | "right" | "justify";

interface HorizontalAlignActionPropsType extends PbEditorPageElementSettingsRenderComponentProps {
    value: string;
    onChange: (type: AlignTypesType) => void;
}
const TextAlignment = ({ value, onChange }: HorizontalAlignActionPropsType) => {
    return (
        <ContentWrapper>
            {alignments.map(type => (
                <Tooltip key={type} content={type} placement={"top"}>
                    <IconButton
                        className={classNames({
                            [classes.activeIcon]: value === type,
                            [classes.icon]: value !== type
                        })}
                        icon={icons[type]}
                        onClick={() => onChange(type as AlignTypesType)}
                    />
                </Tooltip>
            ))}
        </ContentWrapper>
    );
};

export default React.memo(TextAlignment);
