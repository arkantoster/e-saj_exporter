require('dotenv').config();

const axios = require('axios');
const axiosRetry = require('axios-retry');
const moment = require('moment');
const ora = require('ora');

const { JSDOM } = require('jsdom');
const { window } = new JSDOM('');
const $ = require('jquery')(window);

const { promises: fs } = require('fs');

const { Client } = require('pg');

const pgclient = new Client({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_DATABASE,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT,
})

const logfile = `${moment().format('YY-MM-DD-HH-mm-ss')}_esajexporter.log`;

axiosRetry(axios, {
	retries: 10, retryDelay: (retryCount) => {
		currentSpinner.warn()
		var spinner = ora({ text: `Retry #${retryCount}`, prefixText: '  ' });

		spinner.start();
		currentSpinner = spinner;
		log(`NOT OK #${retryCount}`);

		return axiosRetry.exponentialDelay;
	}
});

let lastRequest;
let currentSpinner;

const log = async (str) => {
	str = `[${moment().format('HH:mm:ss.SSS')}] ${str}`
	await fs.appendFile(logfile, `\n${str}`);
};

const requisicao = async (page) => {

	var spinner = ora({ text: `Request Pg. ${page}`, prefixText: '  ' });
	log(`requisição pagina ${page}`)

	spinner.start();
	currentSpinner = spinner;
	lastRequest = moment();

	let res = await axios({
		method: 'get',
		url: `https://esaj.tjsp.jus.br/cjpg/trocarDePagina.do?pagina=${page}`,
		headers: {
			Cookie: 'K-JSESSIONID-edkpfhpp=C964601844668BF3D0DBA69934E9737F; JSESSIONID=A40467DC1196E37977948E94F2407496.cjpg2; __utmc=173948983; __utmz=173948983.1595609835.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); __utma=173948983.1623483240.1595609835.1598659362.1598751413.12; __utmt=1; __utmb=173948983.7.10.1598751413'
		}
	});

	let html = res.data;

	log(`fim requisição pagina ${page}`);

	if (html === '') {
		currentSpinner.fail(`Request Pg. ${page}(${(moment().diff(lastRequest, 'seconds', true) * 1000).toFixed()}ms)`);
	}
	currentSpinner.succeed(`Request Pg. ${page}(${(moment().diff(lastRequest, 'seconds', true) * 1000).toFixed()}ms)`);

	log('processamento pagina ' + page)
	var spinnerProc = ora({ text: `Processing Pg. ${page}`, prefixText: '  ' });
	spinnerProc.start();

	html = html.slice(html.indexOf("<div id=\"divDadosResultado\" >"), -1);
	html = html.slice(0, html.indexOf("</td>\n\t\t<td width=\"20px\">"));
	html = html.replace(/<</g, '');
	html = html.replace(/>>/g, '');
	html = html.replace(/>\n/g, '>');
	html = html.replace(/\n</g, '<');
	html = html.replace(/\n{2,}/g, '\n');
	html = html.replace(/\t/g, '');
	html = html.replace(/\\n/g, '');
	html = html.replace(/\\t/g, '');
	html = html.replace(/\s>/g, '>');
	html = html.replace(/\s</g, '<');
	html = html.replace(/&nbsp;</g, ' ');
	html = html.replace(/\s{2,}/g, ' ');

	let retorno = []

	var test = $(html).find('.fundocinza1')
	$.each(test, (i, v) => {
		let aux = [];

		/*nr*/
		aux.push($(v).find('.fonteNegrito').html().trim())

		/*assunto*/
		aux.push($(v).find('strong:contains("Assunto:")').parent().html().replace('<strong>Assunto:</strong>', '').trim())

		/*classe*/
		aux.push($(v).find('strong:contains("Classe:")').parent().html().replace('<strong>Classe:</strong>', '').trim())

		/*magistrado*/
		aux.push($(v).find('strong:contains("Magistrado:")').parent().html().replace('<strong>Magistrado:</strong>', '').trim())

		/*comarca*/
		aux.push($(v).find('strong:contains("Comarca:")').parent().html().replace('<strong>Comarca:</strong>', '').trim())

		/*foro*/
		aux.push($(v).find('strong:contains("Foro:")').parent().html().replace('<strong>Foro:</strong>', '').trim())

		/*vara*/
		aux.push($(v).find('strong:contains("Vara:")').parent().html().replace('<strong>Vara:</strong>', '').trim())

		/*dataDisponibilizacao*/
		aux.push(moment($(v).find('strong:contains("Data de Disponibilização:")').parent().html().replace('<strong>Data de Disponibilização:</strong>', '').trim(), 'DD/MM/YYYY').format('YYYY-MM-DD'))

		/*sentenca*/
		aux.push($(v).find('div[style="display: none;"]').find('span').html().trim())

		retorno.push(aux);
	});

	log('fim processamento pagina ' + page)
	spinnerProc.succeed()

	return retorno;
}

const index = async () => {
	console.log('');
	console.log('');
	console.log('     ______    _____ ___       __   ______                      __           ');
	console.log('    / ____/   / ___//   |     / /  / ____/  ______  ____  _____/ /____  _____');
	console.log('   / __/______\\__ \\/ /| |__  / /  / __/ | |/_/ __ \\/ __ \\/ ___/ __/ _ \\/ ___/');
	console.log('  / /__/_____/__/ / ___ / /_/ /  / /____>  </ /_/ / /_/ / /  / /_/  __/ /    ');
	console.log(' /_____/    /____/_/  |_\\____/  /_____/_/|_/ .___/\\____/_/   \\__/\\___/_/     ');
	console.log('                                          /_/                                ');
	console.log('');
	console.log('');

	try {
		await fs.writeFile(logfile, '');
	} catch (error) {
		log(`erro ao criar arquivo: ${error}`)
	}

	log('inicio');

	await pgclient.connect();

	let t = 23566
	//23566

	for (let i = 1; i <= t; i++) {

		let dados
		try {
			dados = await requisicao(i);
		} catch (error) {
			log(`erro ao fazer requisição ${i}: ${error}`)
		}

		log('escrevendo resultado')

		for (let j = 0; j < dados.length; j++) {

			const linha = dados[j];
			try {
				await pgclient.query('INSERT INTO public.esaj(nr_processo, assunto, classe, magistrado, comarca, foro, vara, dataDisponibilizacao, sentenca) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', linha);
			} catch (error) {
				log(`erro ao gravar linha ${j} da requisição ${i}: ${error}`)
			}

		}

		log('resultado escrito');
	};

	await pgclient.end()
	log('fim')
}

index();

