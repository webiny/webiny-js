import React from "react";
import { Dialog, DialogContent } from "@webiny/ui/Dialog";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity";

const UserBar = () => {
    const [showLogin, setShowLogin] = React.useState(false);
    const { user, logout, renderAuthentication } = useSecurity();

    if (!user) {
        return (
            <React.Fragment>
                <Dialog open={showLogin} onClose={() => setShowLogin(false)}>
                    <DialogContent>
                        {renderAuthentication({ viewProps: { type: "compact" } })}
                    </DialogContent>
                </Dialog>
                <div className={"webiny-user-bar-demo"}>
                    <span onClick={() => setShowLogin(true)}>[ Log in ]</span>
                </div>
            </React.Fragment>
        );
    }

    return (
        <div className={"webiny-user-bar-demo"}>
            <div>{user.fullName}</div>
            <span onClick={logout}>[ Log out ]</span>
        </div>
    );
};

export default UserBar;
