import { mdbid } from "@webiny/utils";

export class Identifier {
    static generate() {
        return mdbid();
    }
}
