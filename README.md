# e-SAJ Exporter

Processo automatizado de exportação de processos do e-SAJ para uma base de dados PostgreSQL.

## Tabela

Há um script no projeto para a criação da tabela, lembrandoq ue o código está apontado para o schema public, caso a criação da tabela seja feita em outro schema, é necessário fazer a alteração do código.

## Variaveis de ambiente

O processo utiliza algumas variaveis de ambiente, segue a lista:

- DB_USER
-- Contém o usuário da base;
- DB_HOST
-- Contém o host da base;
- DB_DATABASE
-- Contém o nome da base;
- DB_PASSWORD
-- Contém a senha do usuário da base;
- DB_PORT
-- Contém a porta da base;
- REQUEST_URL
-- Contém a url com os parametros de pesquisa do esaj;