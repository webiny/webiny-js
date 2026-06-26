import React from "react";
import styled from "@emotion/styled";

const Code = styled.code`
    font-family: monospace;
    font-size: 0.85rem;
    line-height: 1rem;
`;

export const LocalAwsLambdaTimeoutMessage = () => (
    <>
        Local AWS Lambda function execution timed out.
        <br />
        <br />
        Did you stop the&nbsp;
        <a
            href={"https://www.webiny.com/docs/core-development-concepts/basics/watch-command"}
            rel={"noreferrer noopener"}
            target={"_blank"}
        >
            <Code>webiny watch</Code>
        </a>
        &nbsp;command? If so, please restart the command or deploy your changes via the&nbsp;
        <a
            href={"https://www.webiny.com/docs/core-development-concepts/basics/project-deployment"}
            rel={"noreferrer noopener"}
            target={"_blank"}
        >
            <Code>webiny deploy</Code>
        </a>
        &nbsp;command. For example: <Code>yarn webiny deploy api --env dev</Code>.
        <br />
        <br />
        Learn more:&nbsp;
        <a
            href={"https://webiny.link/local-aws-lambda-development"}
            rel={"noreferrer noopener"}
            target={"_blank"}
        >
            https://webiny.link/local-aws-lambda-development
        </a>
    </>
);
