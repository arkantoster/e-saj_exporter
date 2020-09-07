const axios = require('axios');
const axiosRetry = require('axios-retry');
const moment = require('moment');
const spinner = require('./terminalSpinner');
const log = require('./log');

const { JSDOM } = require('jsdom');
const { error } = require('jquery');
const { window } = new JSDOM('');
const $ = require('jquery')(window);

axiosRetry(axios, {
	retries: 10, retryDelay: (retryCount) => {
		spinner.concludes(undefined, 'warn');
		log(`NOT OK #${retryCount}`);
		spinner.new(`${retryCount}ª tentativa`);
		return 0;
	}
});

requisicao = async (page, Cookie) => {

	let res = await axios({
		method: 'get',
		url: `https://esaj.tjsp.jus.br/cjpg/trocarDePagina.do?pagina=${page}`,
		headers: { Cookie }
	});

	let html = res.data;

	html = html.slice(html.indexOf("<div id=\"divDadosResultado\" >"), -1);
	html = html.slice(0, html.indexOf("</td>\n\t\t<td width=\"20px\">"));
	html = html.replace(/<</g, '');
	html = html.replace(/>>/g, '');
	html = html.replace(/\t/g, '');
	html = html.replace(/\\n/g, '');
	html = html.replace(/\\t/g, '');
	html = html.replace(/\n{2,}/g, '\n');
	html = html.replace(/>\n/g, '>');
	html = html.replace(/\s>/g, '>');
	html = html.replace(/\n</g, '<');
	html = html.replace(/\s</g, '<');
	html = html.replace(/&nbsp;</g, ' ');
	html = html.replace(/\s{2,}/g, ' ');

	let retorno = []

	var aux = $(html).find('.fundocinza1');
	$.each(aux, (i, v) => {
		let subAux = [];

		/*nr*/
		subAux.push($(v).find('.fonteNegrito').html().trim());

		/*assunto*/
		subAux.push($(v).find('strong:contains("Assunto:")').parent().html().replace('<strong>Assunto:</strong>', '').trim());

		/*classe*/
		subAux.push($(v).find('strong:contains("Classe:")').parent().html().replace('<strong>Classe:</strong>', '').trim());

		/*magistrado*/
		subAux.push($(v).find('strong:contains("Magistrado:")').parent().html().replace('<strong>Magistrado:</strong>', '').trim());

		/*comarca*/
		subAux.push($(v).find('strong:contains("Comarca:")').parent().html().replace('<strong>Comarca:</strong>', '').trim());

		/*foro*/
		subAux.push($(v).find('strong:contains("Foro:")').parent().html().replace('<strong>Foro:</strong>', '').trim());

		/*vara*/
		subAux.push($(v).find('strong:contains("Vara:")').parent().html().replace('<strong>Vara:</strong>', '').trim());

		/*dataDisponibilizacao*/
		subAux.push(moment($(v).find('strong:contains("Data de Disponibilização:")').parent().html().replace('<strong>Data de Disponibilização:</strong>', '').trim(), 'DD/MM/YYYY').format('YYYY-MM-DD'));

		/*sentenca*/
		subAux.push($(v).find('div[style="display: none;"]').find('span').html().trim());

		retorno.push(subAux);
	});

	if (retorno.length === 0) {
		spinner.concludes(`Não foi possivel carregar a pg. ${page}`, 'fail');
		throw error(res);
	}

	return retorno;
}

module.exports = requisicao;