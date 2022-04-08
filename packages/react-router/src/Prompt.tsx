/**
 * https://github.com/remix-run/react-router/blob/v5/packages/react-router/modules/Prompt.js
 */
import React from "react";
import { usePrompt } from "~/usePrompt";

export interface PromptProps {
    when: boolean;
    message: string;
}
export const Prompt: React.FC<PromptProps> = ({ when, message }) => {
    usePrompt(message, when);
    return null;
};
