import { PageAtomType } from "../../modules";

export type UpdatePageRevisionActionArgsType = {
    page: Omit<PageAtomType, "content">;
    onFinish?: () => void;
};
