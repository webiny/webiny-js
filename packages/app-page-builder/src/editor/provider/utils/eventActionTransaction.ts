import { useBatching, useUndo } from "recoil-undo";
/**
 * Use this as you would a database transaction
 * send a function that will run and in case of error it will undo the changes to the state
 */
export const eventActionTransaction = async (fn: () => Promise<any>): Promise<any> => {
    const undo = useUndo();
    const { startBatch, endBatch } = useBatching();
    try {
        startBatch();
        const result = await fn();
        endBatch();
        return result;
    } catch (ex) {
        endBatch();
        undo();
        throw ex;
    }
};
