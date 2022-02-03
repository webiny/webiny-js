import { useRecoilValue } from "recoil";
import { activePluginsByTypeNamesSelector } from "~/editor/recoil/modules";

export function useActivePluginsByType(type: string) {
    return useRecoilValue(activePluginsByTypeNamesSelector(type));
}
