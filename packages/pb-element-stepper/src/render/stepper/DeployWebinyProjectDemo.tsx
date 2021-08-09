import React from "react";
import Terminal from "react-animated-term";
import "react-animated-term/dist/react-animated-term.css";

const DeployWebinyProjectDemo = () => {
    const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    const spinnerLines = [
        {
            text: "yarn webiny deploy",
            cmd: true,
            delay: 50
        },
        {
            text: " webiny info: Deploying api project application...",
            cmd: false,
            repeat: true,
            repeatCount: 2,
            frames: spinnerFrames.map(spinner => {
                return {
                    text: spinner + " Deploying project",
                    delay: 20
                };
            })
        },
        {
            text: " webiny info: Running 'build' in 10 packages",
            cmd: false,
            repeat: true,
            repeatCount: 2,
            delay: 20
        },
        {
            text: "",
            cmd: false
        },
        {
            text: " webiny success: Done! Deploy finished in 26.746s",
            cmd: false
        },
        {
            text: " ➜ Main GraphQL API: https://xxxxxx.cloudfront.net/graphql",
            cmd: false
        },
        {
            text: " ➜ Admin app: https://xxxxxx.cloudfront.net",
            cmd: false
        },
        {
            text: " ➜ Headless CMS GraphQL API:",
            cmd: false
        },
        {
            text: "    - Manage API: https://xxxxx.cloudfront.net/cms/manage/{LOCALE_CODE}",
            cmd: false
        },
        {
            text: "    - Read API: https://xxxxx.cloudfront.net/cms/manage/{LOCALE_CODE}",
            cmd: false
        }
    ];
    return <Terminal lines={spinnerLines} interval={30} height={366} />;
};

export default DeployWebinyProjectDemo;
