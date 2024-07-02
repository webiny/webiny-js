import { useContext } from "react";
import { RendererContext } from "~/contexts/Renderer";

export function useRenderer() {
    const context = useContext(RendererContext);

    if (!context) {
        throw Error(`Missing "RendererProvider" context provider in the component hierarchy!`);
    }

    return context;
}
