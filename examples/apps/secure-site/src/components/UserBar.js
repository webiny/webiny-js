import React from "react";
import { Dialog, DialogTitle, DialogContent } from "@webiny/ui/Dialog";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity";

const UserBar = () => {
    const [showLogin, setShowLogin] = React.useState(false);
    const { user, logout, renderAuthentication } = useSecurity();

    if (!user) {
        return (
            <React.Fragment>
                <Dialog open={showLogin} onClose={() => setShowLogin(false)}>
                    <DialogTitle>Login</DialogTitle>
                    <DialogContent>{renderAuthentication()}</DialogContent>
                </Dialog>
                <div className={"webiny-user-bar-demo"}>
                    <a href="#" onClick={() => setShowLogin(true)}>
                        [ Log in ]
                    </a>
                </div>
            </React.Fragment>
        );
    }

    return (
        <div className={"webiny-user-bar-demo"}>
            <div>{user.fullName}</div>
            <a href="#" onClick={logout}>
                [ Log out ]
            </a>
        </div>
    );
};

export default UserBar;
