import { Container } from "./Container";

export function useContainer() {
    const container = Container.current;
    if (!container) {
        throw new Error("No current container");
    }

    return container;
}
