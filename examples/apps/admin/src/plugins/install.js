import React from "react";
import { ButtonPrimary } from "@webiny/ui/Button";

export default [
    {
        name: "install-random",
        type: "install",
        dependencies: ["install-security"],
        secure: false,
        async isInstalled({ client }) {
            return false;
        },
        render({ onInstalled }) {
            return (
                <div>
                    Random installer{" "}
                    <ButtonPrimary onClick={onInstalled}>Install random app</ButtonPrimary>
                </div>
            );
        }
    }
];
