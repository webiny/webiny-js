import React from "react";
import styled from "@emotion/styled";
import { Authenticator } from "@aws-amplify/ui-react";

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
`;

const LoadingIdentity = styled.div`
    text-align: center;
    font-size: 16px;
    padding: 50px;
`;

export const LoginScreen = () => {
    return (
        <Wrapper>
            <Authenticator hideSignUp={true} initialState={"signIn"}>
                <LoadingIdentity>Looking for content...</LoadingIdentity>
            </Authenticator>
        </Wrapper>
    );
};
