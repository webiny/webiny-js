import React from "react";
import { Image } from "@webiny/app/components";
import { ListItemGraphic as UiListItemGraphic } from "@webiny/ui/List";
import { Avatar } from "@webiny/ui/Avatar";
import styled from "@emotion/styled";
import { FolderLevelPermissionsTarget } from "~/types";

interface ListItemGraphicProps {
    target: FolderLevelPermissionsTarget;
}

// Internally, the `Avatar` component applies top/left positioning to the image, which we don't want.
// Not sure why the positioning is applied, but we need to override it.
const StyledAvatar = styled(Avatar)`
    top: initial;
    left: initial;
`;

export const ListItemGraphic = ({ target }: ListItemGraphicProps) => {
    if (target.type === "admin") {
        return (
            <UiListItemGraphic>
                <StyledAvatar
                    renderImage={props => <Image {...props} transform={{ width: 100 }} />}
                    src={target.meta.image}
                    fallbackText={target.name.charAt(0)}
                    alt={"User's avatar."}
                />
            </UiListItemGraphic>
        );
    }

    return (
        <UiListItemGraphic>
            <StyledAvatar fallbackText={target.name.charAt(0)} />
        </UiListItemGraphic>
    );
};
