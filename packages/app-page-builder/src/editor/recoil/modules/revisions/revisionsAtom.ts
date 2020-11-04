import { connectedAtom } from "@webiny/app-page-builder/editor/recoil/modules/connected";

type RevisionsType = any;
type RevisionsAtomType = RevisionsType[];
export const revisionsAtom = connectedAtom<RevisionsAtomType>({
    key: "revisionsAtom",
    default: []
});
