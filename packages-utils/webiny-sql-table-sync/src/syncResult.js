// @flow

import { SyncResultData } from "../types";

class SyncResult {
    data: SyncResultData;
    constructor(data: SyncResultData = {}) {
        this.data = data;
    }
}

export default SyncResult;
