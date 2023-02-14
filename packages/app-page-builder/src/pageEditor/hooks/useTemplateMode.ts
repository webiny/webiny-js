import { useRecoilState } from "recoil";
import { templateModeAtom } from "../state";

export function useTemplateMode() {
    return useRecoilState(templateModeAtom);
}
