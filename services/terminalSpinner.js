const ora = require('ora');
const moment = require('moment');
const log = require('./log');

let currentSpinner;
let timer;
let lastText;

const spinner = {
	new: async (text) => {
		currentSpinner = ora({
			text: text,
			prefixText: '  ',
			spinner: 'dots8Bit'
		});
		log(text);
		lastText = text;
		timer = moment();
		return currentSpinner.start();
	},
	concludes: (text = lastText, status = 'succeed') => {
		log(text);
		return currentSpinner[status](`${text} (${(moment().diff(timer, 'seconds', true) * 1000).toFixed()}ms)`)
	},
	info: (text) => {
		log(text);
		spinner.new('');
		currentSpinner.info(text);
	}
}

module.exports = spinner;
