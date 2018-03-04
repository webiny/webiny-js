import { Entity } from "./../../src";

class One extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("two")
            .entity(Two)
            .setAutoDelete();
    }
}

One.classId = "One";

class Two extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("three")
            .entity(Three)
            .setAutoDelete();
    }
}
Two.classId = "Two";

class Three extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("four")
            .entity(Four)
            .setAutoDelete();
        this.attr("anotherFour")
            .entity(Four)
            .setAutoDelete();
        this.attr("five")
            .entity(Five)
            .setAutoDelete();
        this.attr("six")
            .entity(Six)
            .setAutoDelete();
    }
}
Three.classId = "Three";

class Four extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}
Four.classId = "Four";

class Five extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}
Five.classId = "Five";

class Six extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}
Six.classId = "Six";

export { One, Two, Three, Four, Five, Six };
