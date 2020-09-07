const axios = require('axios');
const log = require('./log');
const spinner = require('./terminalSpinner');

const { JSDOM } = require('jsdom');
const { window } = new JSDOM('');
const $ = require('jquery')(window);

const biscoito = async () => {
	spinner.new("Conectando ao e-SAJ...");
	try {
		let res = await axios({
			method: 'GET',
			url: process.env.REQUEST_URL,
		});
		let asd = $(res.data).find('td:contains("Resultados")[bgcolor="#EEEEEE"]');
		global.totalProcessos = $(asd[0]).html().replace(/\D/g, '').substring(3);
		if (global.totalProcessos === '') global.totalProcessos = 10;
		global.cookies = res.headers['set-cookie'];
		spinner.concludes('Conectado ao e-SAJ');
		return;
	} catch (error) {
		await log(`Erro ao conectar ao e-SAJ: ${error}`);
		spinner.concludes('Não foi possível conectar ao e-SAJ', 'fail');
		process.exit();
	}
}

module.exports = biscoito;