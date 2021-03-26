import { PageAtomType } from "../../modules";

export type UpdatePageRevisionActionArgsType = {
    debounce?: boolean;
    page: Omit<PageAtomType, "content">;
    onFinish?: () => void;
};
