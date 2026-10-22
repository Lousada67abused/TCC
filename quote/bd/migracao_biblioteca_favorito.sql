-- Migração não destrutiva para separar o favorito do status de leitura.
-- Execute na base existente; depois recarregue script_spc.sql para atualizar
-- os contratos das procedures. Não execute script_estrutura.sql nessa base.
-- Reexecutar este arquivo preserva os status e favoritos já migrados.
USE quote;

-- ADD COLUMN condicional via information_schema funciona em MySQL e MariaDB.
SET @quote_coluna_favorito_existe = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'biblioteca'
      AND COLUMN_NAME = 'favorito'
);
SET @quote_adicionar_favorito_sql = IF(
    @quote_coluna_favorito_existe = 0,
    'ALTER TABLE biblioteca ADD COLUMN favorito TINYINT NOT NULL DEFAULT 0 AFTER status',
    'SELECT ''Coluna favorito ja existente.'' AS migracao'
);
PREPARE quote_adicionar_favorito FROM @quote_adicionar_favorito_sql;
EXECUTE quote_adicionar_favorito;
DEALLOCATE PREPARE quote_adicionar_favorito;

-- O status legado não informa o progresso anterior: tratamos esses livros
-- como lidos e mantemos explicitamente sua marcação de favorito.
UPDATE biblioteca
SET status = 'lido', favorito = 1
WHERE status = 'favorito';

-- Preserva todos os valores 0/1 existentes; somente NULL recebe o padrão 0.
UPDATE biblioteca
SET favorito = 0
WHERE favorito IS NULL;

-- A opção legada só é removida do ENUM depois de converter seus registros.
ALTER TABLE biblioteca
    MODIFY COLUMN status ENUM('lido', 'lendo', 'quero ler', 'desisti'),
    MODIFY COLUMN favorito TINYINT NOT NULL DEFAULT 0 AFTER status;
