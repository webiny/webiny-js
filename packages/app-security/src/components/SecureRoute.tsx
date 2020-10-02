import * as React from "react";
import { hasScopes } from "@webiny/app-security";
import { getPlugin } from "@webiny/plugins";
import { ResourcesType } from "../identity";
import { SecureRouteErrorPlugin } from "@webiny/app-security/types";
import { css } from "emotion";
import Helmet from "react-helmet";


import authErrorImg from "../admin/assets/images/SecureRouteError.svg"

const notAuthCss = css({
    display: "block",
    padding: 25,
    textAlign: "center",
    margin: "auto"
})

export default ({
    children,
    scopes
}: {
    children: any;
    scopes?: ResourcesType;
}): React.ReactElement => {
    const checkedScopes = scopes ? hasScopes(scopes, { forceBoolean: true }) : true;

    if (checkedScopes) {
        return children;
    }

    const plugin = getPlugin<SecureRouteErrorPlugin>("secure-route-error");
    if (!plugin) {
        return (
            <div className={notAuthCss}>    
                <Helmet title={"Not authorized"} />
                <img src={authErrorImg} alt="Not Authorized" width="40%"/>
                <p>You are not authorized to view this route.</p>
                <p>Please contact your administrator to request access.</p>
                <a href="/">Take me back.</a>
            </div>
        );
    }
    return plugin.render();
};
