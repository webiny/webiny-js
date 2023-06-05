import { mdbid } from "@webiny/utils";

export const ids = {
    A: mdbid(),
    B: mdbid(),
    C: mdbid(),
    D: mdbid()
};

export const fileAData = {
    id: ids.A,
    key: `${ids.A}/filenameA.png`,
    name: "filenameA.png",
    size: 123456,
    type: "image/png",
    tags: ["sketch", "file-a", "webiny"],
    aliases: []
};
export const fileBData = {
    id: ids.B,
    key: `${ids.B}/filenameB.png`,
    name: "filenameB.png",
    size: 123456,
    type: "image/png",
    tags: ["art", "file-b"],
    aliases: []
};
export const fileCData = {
    id: ids.C,
    key: `${ids.C}/filenameC.png`,
    name: "filenameC.png",
    size: 123456,
    type: "image/png",
    tags: ["art", "sketch", "webiny", "file-c"],
    aliases: []
};
export const fileDData = {
    id: ids.D,
    key: `${ids.D}/filenameD.png`,
    name: "filenameD.png",
    size: 123456,
    type: "image/png",
    tags: ["scope:apw:file-d", "scope:apw", "scope:apw:media"],
    aliases: []
};
