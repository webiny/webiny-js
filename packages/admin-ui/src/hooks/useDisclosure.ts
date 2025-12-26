import { useCallback, useState } from "react";

export const useDisclosure = <TData = undefined>(isOpenDefault = false) => {
    const [isOpen, defaultSetIsOpen] = useState(isOpenDefault);
    const [data, setData] = useState<TData | null>(null);

    const setIsOpen = useCallback(
        (isOpen: boolean | ((prev: boolean) => boolean), data?: TData) => {
            defaultSetIsOpen(isOpen);
            if (typeof data !== "undefined") {
                setData(data);
            }
        },
        []
    );

    const open = useCallback((data?: TData) => {
        setIsOpen(true, data);
    }, []);

    const close = useCallback(() => setIsOpen(false), []);

    const toggle = useCallback((toSet?: boolean) => {
        if (typeof toSet === "undefined") {
            setIsOpen(state => !state);
        } else {
            setIsOpen(Boolean(toSet));
        }
    }, []);

    return { isOpen, setIsOpen, open, close, toggle, data };
};
