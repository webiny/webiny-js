import React from "react";
import { useAuthenticator } from "@webiny/app-cognito-essentials/hooks/useAuthenticator";
import { CircularProgress } from "@webiny/ui/Progress";

const CheckingUser = () => {
    const { checkingUser } = useAuthenticator();

    return checkingUser ? <CircularProgress label={"Verifying user..."} /> : null;
};

export default CheckingUser;
