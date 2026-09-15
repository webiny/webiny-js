import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as LogoutIcon } from "@webiny/icons/logout.svg";
import { Command } from "../abstractions.js";
import { LogOutUseCase } from "~/features/security/LogOut/index.js";

class SignOutCommandImpl implements Command.Interface {
    name = "admin.signOut";
    label = "Sign out";
    description = "Log out of the admin app";
    category = "Actions";
    keywords = ["logout", "exit", "session"];
    icon = <Icon icon={<LogoutIcon />} size="sm" color="neutral-strong" label="" />;

    constructor(private logOut: LogOutUseCase.Interface) {}

    execute() {
        void this.logOut.execute();
    }
}

export const SignOutCommand = Command.createImplementation({
    implementation: SignOutCommandImpl,
    dependencies: [LogOutUseCase]
});
