// @flow
import { Model } from "webiny-model";

export default class FileModel extends Model {
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
        this.attr("meta").object();
    }
}
