# Backup do banco de dados

O arquivo `dump.sql` contém a estrutura e os dados atuais das dez tabelas do Sistema de Gerenciamento de Bolsistas no momento da exportação.

## Segurança

Por segurança, os hashes armazenados no campo `coordenadores.senha` foram substituídos por `REDACTED_FROM_REPOSITORY`. Nenhuma credencial de conexão, chave de API, token ou segredo de ambiente está incluído no dump. Depois de restaurar o banco, redefina as senhas dos coordenadores antes de habilitar o login local.

## Restauração

Crie um banco MySQL vazio e execute:

```bash
mysql --host=SEU_HOST --user=SEU_USUARIO --password SEU_BANCO < database/dump.sql
```

O dump desativa temporariamente a verificação de chaves estrangeiras, recria todas as tabelas e reinsere os registros exportados.
