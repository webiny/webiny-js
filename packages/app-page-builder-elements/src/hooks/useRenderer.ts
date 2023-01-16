import { useContext } from "react";
import { RendererContext } from "~/contexts/Renderer";
import { RendererContextValue } from "~/types";

export function useRenderer(): RendererContextValue {
    return useContext(RendererContext);
}
