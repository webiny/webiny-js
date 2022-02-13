import { PageAtomType } from "../../modules";

export interface UpdatePageRevisionActionArgsType {
    debounce?: boolean;
    page: Omit<Partial<PageAtomType>, "content">;
    onFinish?: () => void;
}
