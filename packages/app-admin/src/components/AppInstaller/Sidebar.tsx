import React, { Fragment } from "react";
import classSet from "classnames";
import { Typography } from "@webiny/ui/Typography";
import signInDivider from "./assets/sign-in-divider.svg";
import { Installer } from "./useInstaller";
import { Tags } from "~/base/ui/Tags";
import { Logo } from "~/base/ui/Logo";
import { useAdminConfig } from "~/config/AdminConfig";
import {
    Heading,
    Icon,
    type ProgressItemDto,
    ProgressItemState,
    SteppedProgress,
    Text
} from "@webiny/admin-ui";

interface InstallationsProps {
    title: React.ReactNode;
    allInstallers: Installer[];
    installer: Installer;
    showLogin: boolean;
}
const Installations = (props: InstallationsProps) => {
    const { title, allInstallers, installer, showLogin } = props;
    const renderList = () => {
        const loginItem = (
            <li key={"login"} className={"sign-in"}>
                <img src={signInDivider} alt={""} />
                <Typography use={"overline"} className={"note"}>
                    TO CONTINUE THE INSTALLATION AFTER THIS POINT YOU’LL NEED TO SIGN IN
                </Typography>
            </li>
        );
    };

    const steppedProgressItems = allInstallers.map(
        ({ name, title, installed }): ProgressItemDto => {
            const getState = () => {
                const active = installer && !showLogin && name === installer.name;

                if (installed) {
                    return ProgressItemState.COMPLETED_AFFIRMATIVE;
                }

                if (active) {
                    return ProgressItemState.IN_PROGRESS;
                }

                return ProgressItemState.IDLE;
            };

            return {
                label: title,
                state: getState()
            };
        }
    );

    return (
        <>
            <Text as={"div"} className={"wby-mb-lg"}>
                {title}
            </Text>
            <SteppedProgress items={steppedProgressItems} />
        </>
    );
};

interface SidebarProps {
    allInstallers: Installer[];
    installer: Installer;
    showLogin: boolean;
}

const Sidebar = ({ allInstallers, installer, showLogin }: SidebarProps) => {
    const installations = allInstallers.filter(installer => installer.type === "install");
    const { tenant } = useAdminConfig();

    return (
        <div className={"wby-h-screen wby-p-xl wby-overflow-y-scroll wby-bg-neutral-light"}>
            <Tags tags={{ location: "installer" }}>
                <div className={"wby-flex wby-items-center wby-gap-x-sm wby-mb-lg wby-truncate"}>
                    <Logo />
                    <Heading level={5} className={"wby-truncate"}>
                        {tenant.name}
                    </Heading>
                </div>
                {installations.length > 0 && (
                    <Installations
                        title={"Follow these steps to create your project:"}
                        allInstallers={installations}
                        installer={installer}
                        showLogin={showLogin}
                    />
                )}
            </Tags>
        </div>
    );
};
export default Sidebar;
