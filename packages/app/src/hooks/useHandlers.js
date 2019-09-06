import { useRef, useEffect } from "react";

export function useHandlers(props, factories) {
    const propsRef = useRef(props);

    const handlersRef = useRef(
        (() => {
            const names = Object.keys(factories);
            return names.reduce((handlers, name) => {
                handlers[name] = (...args) => {
                    const handler = factories[name](propsRef.current);
                    return handler(...args);
                };
                return handlers;
            }, {});
        })()
    );

    useEffect(() => {
        propsRef.current = props;
    });

    return handlersRef.current;
}
