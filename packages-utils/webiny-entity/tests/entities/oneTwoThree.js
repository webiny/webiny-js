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

class Two extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("three")
            .entity(Three)
            .setAutoDelete();
    }
}

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

class Four extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

class Five extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

class Six extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

export { One, Two, Three, Four, Five, Six };
