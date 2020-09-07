require('dotenv').config();

const axios = require('axios');
const log = require('./services/log');
const requisicao = require('./services/requisicao');
const biscoito = require('./services/biscoito');
const spinner = require('./services/terminalSpinner');

const { JSDOM } = require('jsdom');
const { window } = new JSDOM('');
const $ = require('jquery')(window);

const { Client } = require('pg');

const pgclient = new Client({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_DATABASE,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT,
})

const index = async () => {
	console.log('');
	console.log('');
	console.log('      ______    _____ ___       __   ______                      __           ');
	console.log('     / ____/   / ___//   |     / /  / ____/  ______  ____  _____/ /____  _____');
	console.log('    / __/______\\__ \\/ /| |__  / /  / __/ | |/_/ __ \\/ __ \\/ ___/ __/ _ \\/ ___/');
	console.log('   / /__/_____/__/ / ___ / /_/ /  / /____>  </ /_/ / /_/ / /  / /_/  __/ /    ');
	console.log('  /_____/    /____/_/  |_\\____/  /_____/_/|_/ .___/\\____/_/   \\__/\\___/_/     ');
	console.log('                                           /_/                                ');
	console.log('');
	console.log('');

	log('Processo iniciado');

	global.biscoito = 0;
	await biscoito();

	spinner.info(`${global.totalProcessos} processos foram encontrados`);

	spinner.new("Conectando à base de dados...");
	try {
		await pgclient.connect();
		spinner.concludes('Conectado à base de dados');
	} catch (error) {
		await log(`Erro ao conectar à base de dados: ${error}`);
		spinner.concludes('Não foi possível conectar à base de dados', 'fail');
		process.exit();
	}

	for (let i = 1; i <= Math.ceil(global.totalProcessos / 10); i++) {

		let dados = [];

		spinner.new(`Requisitando pg. ${i}...`);
		try {
			dados = await requisicao(i, global.cookies);
			spinner.concludes(`Requisição pg. ${i} concluída`);
		} catch (error) {
			await log(`Erro ao fazer requisição na pg. ${i}: ${error}`);
		}

		if (dados.length === 0) {
			i -= 1;
			spinner.info('Não há dados a serem gravados, vamos atualizar os Cookies.');
			try {
				await biscoito();
			} catch (error) {
				process.exit()
			}
		} else {
		log('escrevendo resultado');
		spinner.new(`Gravando dados...`);
		try {
			for (let j = 0; j < dados.length; j++)
				await pgclient.query(`INSERT INTO public.esaj (nr_processo, assunto, classe, magistrado, comarca, foro, vara, dataDisponibilizacao, sentenca) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (nr_processo) DO NOTHING`, dados[j]);
			spinner.concludes('Dados gravados.');
			log('resultado escrito');
		} catch (error) {
			await log(`Erro ao gravar linha ${j} da pg. ${i}: ${error}`);
			}
		}
	};

	await pgclient.end();
	log('processo encerrado');
}

index();

