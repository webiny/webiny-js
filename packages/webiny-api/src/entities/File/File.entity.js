// @flow
import { Entity } from "../Entity";

export default class File extends Entity {
    name: string;
    size: number;
    src: string;
    type: string;
    constructor() {
        super();
        this.attr("name").char();
        this.attr("size").integer();
        this.attr("src").char();
        this.attr("type").char();
    }
}

File.classId = "File";
File.storageClassId = "Files";
