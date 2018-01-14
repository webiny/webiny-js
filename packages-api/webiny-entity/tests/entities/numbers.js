const {Entity} = require('./../../src');

class One extends Entity {
	constructor() {
		super();
		this.attr('name').char();
		this.attr('two').entity(Two);
	}
}

class Two extends Entity {
	constructor() {
		super();
		this.attr('name').char();
		this.attr('three').entity(Three);
	}
}

class Three extends Entity {
	constructor() {
		super();
		this.attr('name').char();
		this.attr('four').entity(Four);
		this.attr('anotherFour').entity(Four);
		this.attr('five').entity(Five);
		this.attr('six').entity(Six);
	}
}

class Four extends Entity {
	constructor() {
		super();
		this.attr('name').char();
	}
}

class Five extends Entity {
	constructor() {
		super();
		this.attr('name').char();
	}
}

class Six extends Entity {
	constructor() {
		super();
		this.attr('name').char();
	}
}

module.exports = {
	One, Two, Three, Four, Five, Six
};