import { To } from "history";
import { NavigateOptions } from "react-router";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export interface UseHistory {
    push: (to: To, options?: NavigateOptions) => void;
    block: (message: string) => void;
    unblock: () => void;
}
export const useHistory = (): UseHistory => {
    const navigate = useNavigate();

    const [blocked, setBlocked] = useState<string | null>(null);
    return {
        push: (to, options) => {
            if (blocked) {
                setBlocked(null);
                if (!prompt(blocked)) {
                    return;
                }
            }
            return navigate(to, options);
        },
        block: message => {
            setBlocked(message);
        },
        unblock: () => {
            setBlocked(null);
        }
    };
};
