/**
 * https://github.com/remix-run/react-router/blob/v5/packages/react-router/modules/Prompt.js
 */
import React from "react";
import { useRouter } from "~/index";

export interface PromptProps {
    when: boolean;
    message: string;
}
export const Prompt: React.FC<PromptProps> = ({ when, message }) => {
    const { history } = useRouter();

    if (!when) {
        history.unblock();
        return null;
    }
    history.block(message);
    return null;
};
