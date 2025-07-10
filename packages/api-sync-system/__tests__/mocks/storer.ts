import { type IStorerParams, Storer } from "~/resolver/app/storer/Storer.js";

export const createMockStorer = (
    params: Pick<IStorerParams, "createDocumentClient"> &
        Partial<Omit<IStorerParams, "createDocumentClient">>
) => {
    return new Storer(params);
};
