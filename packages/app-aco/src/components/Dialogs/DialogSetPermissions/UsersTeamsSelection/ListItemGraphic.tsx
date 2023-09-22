import React from "react";
import { Image } from "@webiny/app/components";
import { ListItemGraphic as UiListItemGraphic } from "@webiny/ui/List";
import { Avatar } from "@webiny/ui/Avatar";
import styled from "@emotion/styled";

interface ListItemGraphicProps {
    user?: any;
    team?: any;
}

// Internally, the `Avatar` component applies top/left positioning to the image, which we don't want.
// Not sure why the positioning is applied, but we need to override it.
const StyledAvatar = styled(Avatar)`
    top: initial;
    left: initial;
`;

export const ListItemGraphic: React.FC<ListItemGraphicProps> = ({ user, team }) => {
    if (user) {
        return (
            <UiListItemGraphic>
                <StyledAvatar
                    renderImage={props => <Image {...props} transform={{ width: 100 }} />}
                    src={user.avatar ? user.avatar.src : user.gravatar}
                    fallbackText={user.firstName}
                    alt={"User's avatar."}
                />
            </UiListItemGraphic>
        );
    }

    return (
        <UiListItemGraphic>
            <StyledAvatar fallbackText={team.name.charAt(0)} />
        </UiListItemGraphic>
    );
};
