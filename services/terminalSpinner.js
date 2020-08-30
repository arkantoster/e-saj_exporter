const ora = require('ora');
const moment = require('moment');

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
		lastText = text;
		timer = moment();
		return currentSpinner.start();
	},
	concludes: (text = lastText, status = 'succeed') => currentSpinner[status](`${text} (${(moment().diff(timer, 'seconds', true) * 1000).toFixed()}ms)`),
	info: (text) => {
		spinner.new('');
		currentSpinner.info(text);
	}
}

module.exports = spinner;
