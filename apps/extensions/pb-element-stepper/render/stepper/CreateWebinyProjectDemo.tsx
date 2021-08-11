import React from "react";
import Terminal from "react-animated-term";
import "react-animated-term/dist/react-animated-term.css";

const CreateWebinyProjectDemo = () => {
    const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    const spinnerLines = [
        {
            text: "npx create-webiny-project my-project",
            cmd: true,
            delay: 50
        },
        {
            text: " ✔ Prepare project folder",
            cmd: false,
            repeat: true,
            repeatCount: 2,
            frames: spinnerFrames.map(spinner => {
                return {
                    text: spinner + " Prepare project folder",
                    delay: 20
                };
            })
        },
        {
            text: " ✔ Install template package",
            cmd: false,
            repeat: true,
            repeatCount: 2,
            delay: 20
        },
        {
            text: " ✔ Initialize git",
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
            text: " 🎉 Your new Webiny project is ready!",
            cmd: false
        },
        {
            text: " Finish the setup by running the following command: ",
            cmd: false
        },
        {
            text: " cd my-project && yarn webiny deploy",
            cmd: false
        }
    ];
    return <Terminal lines={spinnerLines} interval={30} height={366} />;
};

export default CreateWebinyProjectDemo;
