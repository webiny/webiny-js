const _ = require('lodash');

class DataExtractor {
	async get(data, keys) {
		// First we remove all breaks from the string.
		keys = keys.replace(/\s/g, '').trim();

		// Recursively processes all root and nested keys.
		return this.__process({data, keys}).then(({output}) => output);
	}

	async __process({data, keys = '', output = {}, initialTrajectory = []}) {
		let key = '', characters = 0, currentTrajectory = initialTrajectory.slice(0);
		outerLoop:
			for (let i = 0; i <= keys.length; i++) {
				const current = keys[i];
				characters++;
				switch (true) {
					case current === ',':
					case current === undefined:
						key && await this.__modifyOutput({output, key, data, trajectory: currentTrajectory});
						key = '';
						currentTrajectory = initialTrajectory.slice(0);
						break;
					case current === ']':
						key && await this.__modifyOutput({output, key, data, trajectory: currentTrajectory});
						break outerLoop;
					case current === '[':
						const trajectory = currentTrajectory.splice(0);
						trajectory.push(key);
						const nested = await this.__process({
							data,
							initialTrajectory: trajectory,
							keys: keys.substr(i + 1),
							output
						});
						characters += nested.processed.characters;
						i += nested.processed.characters;
						key = '';
						break;
					case current === '.':
						currentTrajectory.push(key);
						key = '';
						break;
					default:
						key += current;
				}
			}

		return {
			output: output,
			processed: {characters}
		}
	}

	async __modifyOutput({output, data = {}, key = '', trajectory = []}) {
		const fragments = {output, data};

		if (trajectory.length === 0) {
			const value = await fragments.data[key];

			if (typeof(value) === 'undefined') {
				// Don't assign the key then, since undefined is not a part of JSON standard.
			} else {
				fragments.output[key] = await fragments.data[key];
			}

			return;
		}

		for (let i = 0; i < trajectory.length; i++) {
			const step = trajectory[i];

			if (typeof(fragments.output[step]) === 'undefined') {
				fragments.output[step] = _.isArray(fragments.data[step]) ? [] : {}; // TODO: Check, is this the case really?
			}

			if (_.isArray(fragments.data[step])) {
				for (let j = 0; j < fragments.data[step].length; j++) {
					if (typeof(fragments.output[step][j]) === 'undefined') {
						fragments.output[step][j] = {}; // TODO: Check, is this the case really?
					}

					await this.__modifyOutput({
						output: fragments.output[step][j],
						trajectory: trajectory.slice(i + 1),
						key,
						data: fragments.data[step][j]
					});
				}

				break;
			}

			fragments.output = await fragments.output[step];
			fragments.data = await fragments.data[step];

			await this.__modifyOutput({
				output: fragments.output,
				data: fragments.data,
				trajectory: trajectory.slice(i + 1),
				key
			});
		}
	}
}

module.exports = new DataExtractor();