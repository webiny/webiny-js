import React from "react";
import { useWebsiteSecurity } from "@demo/website";
import styled from "@emotion/styled";
import theme from "theme/theme";
import { Link } from "@webiny/react-router";

// Using the `Link` component from `@webiny/react-router` ensures that linked pages are preloaded correctly.
const StyledLink = styled(Link)`
    color: ${theme.styles.colors.color1};
`;

const Logout = styled.span`
    cursor: pointer;
    color: ${theme.styles.colors.color1};
`;

export const UserInfo = () => {
    const { identity } = useWebsiteSecurity();

    const logout = () => {
        identity && identity.logout();
    };

    if (identity) {
        return (
            <div>
                Hello, {identity.displayName}! (<Logout onClick={logout}>Logout</Logout>)
            </div>
        );
    }

    return <StyledLink to={"/login"}>Login</StyledLink>;
};
