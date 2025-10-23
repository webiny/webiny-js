import * as React from "react";
import Helmet from "react-helmet";
import authErrorImg from "./SecureRouteError.svg";
import { Link, Text } from "@webiny/admin-ui";

export const NotAuthorizedError = () => {
    return (
        <div className={"flex-1"}>
            <div
                className={
                    "h-full flex flex-col items-center justify-center text-center gap-xs"
                }
            >
                <Helmet title={"Not authorized"} />

                <img
                    width={200}
                    height={200}
                    src={authErrorImg}
                    alt="Not Authorized"
                    className={"mb-xl"}
                />
                <Text>You are not authorized to view this route.</Text>
                <Text>Please contact your administrator to request access.</Text>
                <Link to="/">Take me back.</Link>
            </div>
        </div>
    );
};
