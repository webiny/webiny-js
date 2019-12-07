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
                <div style={{ width: "100%", position: "fixed", zIndex: 1000 }}>
                    <button style={{ float: "right" }} onClick={() => setShowLogin(true)}>
                        Log in
                    </button>
                </div>{" "}
            </React.Fragment>
        );
    }

    return (
        <div style={{ width: "100%", position: "fixed", zIndex: 1000 }}>
            <div style={{ float: "left", color: "black" }}>{user.fullName}</div>
            <button style={{ float: "right" }} onClick={logout}>
                Log out
            </button>
        </div>
    );
};

export default UserBar;
