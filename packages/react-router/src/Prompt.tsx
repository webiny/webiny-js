/**
 * https://github.com/remix-run/react-router/blob/v5/packages/react-router/modules/Prompt.js
 */
import { usePrompt } from "~/usePrompt";

export interface PromptProps {
    when: boolean;
    message: string;
}
export const Prompt = ({ when, message }: PromptProps) => {
    usePrompt(message, when);
    return null;
};
