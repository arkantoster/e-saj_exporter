create table esaj (
	id										serial primary key,
	nr_processo						varchar(200),
	classe								varchar(200),
	assunto								varchar(200),
	magistrado						varchar(200),
	comarca								varchar(200),
	foro									varchar(200),
	vara									varchar(200),
	datadisponibilizacao	date,
	sentenca							text
);