import { Entity } from "webiny-api/entities";

export default class BufferEntity extends Entity {
    constructor() {
        super();
        this.attr("buffer").buffer();
    }
}
BufferEntity.classId = "BufferEntity";
