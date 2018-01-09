const _ = require('lodash');

class DataExtractor {
	async get(data, paths) {
		// First we remove all breaks from the string.
		paths = paths.replace(/\s/g, '').trim();

		// Recursively processes all root and nested keys.
		return (await this.process(data, paths)).output;
	}

	async process(data, paths, output = {}) {
		let path = '', characters = 0;

		outerLoop:
		for (let i = 0; i <= paths.length; i++) {
			const current = paths[i];
			characters++;
			switch (true) {
				case current === ',':
                case current === undefined:
                    path && _.set(output, path, await _.get(data, path));
					path = '';
					break;
				case current === ']':
					_.set(output, path, await _.get(data, path));
					break outerLoop;
				case current === '[':
					const nested = await this.process(await _.get(data, path), paths.substr(i + 1), await _.get(output, path, {}));
					_.set(output, path, nested.output);
					i += nested.processed.characters;
					path = '';
					break;
				default:
					path += current;
			}
		}

		return {
			output,
			processed: {characters}
		}
	}
}

module.exports = new DataExtractor();