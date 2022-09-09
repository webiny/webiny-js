import { CmsEntry, CmsModel } from "~/types";

interface Params {
    model: CmsModel;
}
export const createValueKeyToStorageConverter = ({ model }: Params) => {
    return <T extends CmsEntry = CmsEntry>(entry: T): T => {};
};
