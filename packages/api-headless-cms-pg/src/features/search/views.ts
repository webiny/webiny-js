/**
 * Every entry has up to two rows in the search table: its latest revision and its published one.
 * Binned entries keep their rows under separate views, so listings never mix them up.
 */
export const getView = (published: boolean, deleted: boolean): number => {
    return (published ? 2 : 1) + (deleted ? 2 : 0);
};
