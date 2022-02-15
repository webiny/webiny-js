import { useRef, useEffect } from "react";

/**
 * TODO: figure out any types.
 */
interface Props {
    [key: string]: any;
}
interface Factory {
    (...args: any): any;
}
export function useHandler(props: Props, factory: Factory) {
    const propsRef = useRef(props);

    const handlerRef = useRef((...args: any) => {
        const handler = factory(propsRef.current);
        return handler(...args);
    });

    useEffect(() => {
        propsRef.current = props;
    });

    return handlerRef.current;
}
