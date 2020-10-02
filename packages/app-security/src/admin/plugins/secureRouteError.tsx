import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import Helmet from "react-helmet";
import { css } from "emotion"
import authErrorImg from "../assets/images/SecureRouteError.svg"

const notAuthCss = css({
    display: "block",
    padding: 25,
    textAlign: "center",
    margin: "auto"
})

type SecureRouteErrorPlugin = Plugin & { render: () => React.ReactNode };

const plugin: SecureRouteErrorPlugin = {
    type: "secure-route-error",
    name: "secure-route-error",
    render() {
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
};

export default plugin;
