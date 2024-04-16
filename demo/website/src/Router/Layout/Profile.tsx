import React from "react";
import { useSecurity } from "@webiny/app-security";
import styled from "@emotion/styled";

const Logout = styled.a`
    color: #fc4f00;
    cursor: pointer;
    :hover {
        text-decoration: underline;
    }
`;

export const Profile = () => {
    const { identity } = useSecurity();

    if (!identity) {
        return null;
    }

    return (
        <div>
            Hi, {identity.displayName}! (<Logout onClick={() => identity.logout()}>logout</Logout>)
        </div>
    );
};
