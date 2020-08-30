const { promises: fs } = require('fs');
const moment = require('moment');

const logfile = `./logs/${moment().format('YY-MM-DD-HH-mm-ss')}_esajexporter.log`;

const log = async (str) => {
	str = `[${moment().format('HH:mm:ss.SSS')}] ${str}`
	return await fs.appendFile(logfile, `\n${str}`);
};

module.exports = log;