import { featureFlags } from "@webiny/feature-flags";
export const showLexicalEditor = (): boolean => {
    return featureFlags?.pbLexicalEditor === true;
};
