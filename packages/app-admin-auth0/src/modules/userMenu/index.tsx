import React, { Fragment } from "react";
import {
    AddUserMenuItem,
    UserMenuHandleRenderer,
    Compose,
    Plugins
} from "@webiny/app-serverless-cms";
import { UserInfo } from "~/modules/userMenu/userInfo";
import { SignOut } from "~/modules/userMenu/signOut";
import { UserImage } from "~/modules/userMenu/userImage";
import { ExitTenant } from "./exitTenant";

const UserImageHOC = (): React.FC => {
    return function UserImageHOC() {
        return <UserImage />;
    };
};

export const UserMenuModule: React.FC = () => {
    return (
        <Fragment>
            <Compose component={UserMenuHandleRenderer} with={UserImageHOC} />
            <Plugins>
                <AddUserMenuItem element={<UserInfo />} />
                <AddUserMenuItem element={<ExitTenant />} />
                <AddUserMenuItem element={<SignOut />} />
            </Plugins>
        </Fragment>
    );
};
