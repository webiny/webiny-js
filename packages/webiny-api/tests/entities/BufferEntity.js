import { Entity } from "../../src/entities";

export default class BufferEntity extends Entity {
    constructor() {
        super();
        this.attr("buffer").buffer();
    }
}
BufferEntity.classId = "BufferEntity";
