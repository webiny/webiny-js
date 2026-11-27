import React from "react";

const Code = ({ children }: { children: React.ReactNode }) => (
    <code className={"font-mono text-[0.85rem] leading-[1rem]"}>{children}</code>
);

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
