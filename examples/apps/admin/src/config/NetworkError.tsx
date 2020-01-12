import React from "react";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import { Alert } from "@webiny/ui/Alert";
import { Elevation } from "@webiny/ui/Elevation";
import { css } from "emotion";

const GET_ERROR = gql`
    {
        networkError
    }
`;

const errorStyle = css({
    margin: 50,
    padding: "15px 25px 5px 25px",
    boxSizing: "border-box"
});

const NetworkError = ({ children }) => {
    const { data } = useQuery(GET_ERROR, { fetchPolicy: "cache-only" });

    return data && data.networkError ? (
        <Elevation css={errorStyle} z={2}>
            <Alert type={"danger"} title={"Network error"}>
                Your API seems to be unavailable!
                <br />
                Make sure your API is available at{" "}
                <strong>{process.env.REACT_APP_GRAPHQL_API_URL}</strong>
            </Alert>
        </Elevation>
    ) : (
        children
    );
};

export { NetworkError, GET_ERROR };
