/**
 * https://github.com/remix-run/react-router/blob/v5/packages/react-router/modules/Prompt.js
 */
import React from "react";

export interface PromptProps {
    when: boolean;
    message: string;
}
export const Prompt: React.FC<PromptProps> = ({ when, message }) => {
    if (!when) {
        return null;
    }
    // TODO make sure this works
    prompt(message);
    console.log("!CHECK HERE PROMPT!");
    return null;
};
