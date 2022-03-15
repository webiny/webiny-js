import { useRef, useEffect } from "react";

type HandlerProps = { [key: string]: any };
type HandlerFactories = { [key: string]: (props: HandlerProps) => (...params: any[]) => any };
type Handlers = {
    [K in keyof HandlerFactories]: (...params: any[]) => any;
};

export function useHandlers<H = Handlers>(props: HandlerProps, factories: HandlerFactories) {
    const propsRef = useRef(props);

    const handlersRef = useRef(
        (() => {
            const names = Object.keys(factories);
            return names.reduce((handlers, name) => {
                /**
                 * TODO: figure out args types
                 */
                handlers[name] = (...args: any) => {
                    const handler = factories[name](propsRef.current);
                    return handler(...args);
                };
                return handlers;
            }, {} as Record<string, any>);
        })()
    );

    useEffect(() => {
        propsRef.current = props;
    });

    return handlersRef.current as H;
}
