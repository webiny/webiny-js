import { useRef, useEffect } from "react";

export function useHandler(props, factory) {
    const propsRef = useRef(props);

    const handlerRef = useRef((...args) => {
        const handler = factory(propsRef.current);
        return handler(...args);
    });

    useEffect(() => {
        propsRef.current = props;
    });

    return handlerRef.current;
}
