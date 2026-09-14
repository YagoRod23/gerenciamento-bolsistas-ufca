# TODO - Sistema de Gerenciamento de Bolsistas

## Features Implementadas

- [x] Dashboard com estatísticas
- [x] CRUD de Projetos
- [x] CRUD de Bolsistas
- [x] CRUD de Documentos
- [x] Upload de arquivos PDF
- [x] Controle de Pagamentos
- [x] Relatórios com exportação Excel
- [x] Sistema de divisão por anos (editais anuais)
- [x] Campo "Ano" nos projetos
- [x] Filtro por ano na página de projetos
- [x] Funcionalidade de renovação de projetos
- [x] Dashboard com gráficos interativos
- [x] Gráfico de documentos por status
- [x] Gráfico de bolsistas por projeto
- [x] Gráfico de evolução mensal
- [x] Filtro por ano no dashboard
- [x] Gráfico de carga horária por projeto

## Features Prioritárias (Em Implementação)

- [x] 1. Gestão de Horários Previstos - Cadastrar horários semanais dos bolsistas
- [ ] 2. Histórico de Alterações - Auditoria completa de todas as ações
- [ ] 3. Busca e Filtros Avançados - Melhorar usabilidade em todas as páginas
- [x] 4. Relatório de Conformidade em PDF - Documento oficial formatado
- [x] 5. Análise Automática de Frequências com IA - Validar carga horária e atividades

## Bugs Conhecidos

- [x] Erro 500 ao chamar análise IA - "LLM invoke failed 500" ao clicar em Analisar com IA - RESOLVIDO: Implementada extração de texto do PDF antes de enviar ao LLM
- [x] Erro ao excluir documentos pendentes - Investigar e corrigir - RESOLVIDO: Adicionada função deleteDocumento no backend

## Melhorias Futuras

- Portal do Bolsista (acesso separado)
- OCR Automático (análise de PDFs)
- Sistema de Workflow (aprovação em etapas)
- Calendário Integrado
- Sistema de Permissões



## Novas Features Solicitadas

- [x] Editar e excluir pagamentos solicitados - Adicionar botões de ação na página de Controle de Pagamentos (JÁ IMPLEMENTADO)
- [x] Dividir relatórios por anos - Filtrar dados por ano na página de Relatórios
- [x] Opção de apagar documentos pendentes - Botão de excluir sem aprovar/reprovar
- [x] Opção de apagar solicitações de pagamento - Botão de excluir nas solicitações já criadas


- [x] Alterar gráfico de carga horária para mostrar horas trabalhadas (soma das frequências aprovadas) em vez de carga prevista



## Bugs Reportados (Urgentes)

- [x] Soma de horas pela IA está incorreta - RESOLVIDO: Melhorado prompt com instruções rigorosas e adicionada validação automática de soma no backend
- [x] Erro ao aprovar documento - RESOLVIDO: Corrigido mapeamento de campo (status → statusDocumento)



## Sistema de Autenticação Multi-Coordenador (Em Desenvolvimento)

- [x] Criar tabela de coordenadores no banco de dados
- [x] Implementar autenticação com usuário/senha
- [x] Criar página de login
- [ ] Implementar sistema de autorização (filtrar projetos por coordenador)
- [x] Criar página de gerenciamento de coordenadores (super admin)
- [ ] Criar página de alterar senha
- [ ] Implementar toggle de visualização para super admin
- [ ] Testar fluxo completo de autenticação e autorização



## Bugs Reportados (Urgentes)

- [x] Erro ao analisar frequência - "pdftotext: not found" ao clicar em Analisar com IA - RESOLVIDO: Adicionados logs detalhados na função downloadFile e extractTextFromPDF


## Autenticação e Identidade Visual UFCA (Nova Iteração)

- [x] Atualizar identidade visual com cores e fonte UFCA no index.css
- [x] Adicionar fonte Alegreya Sans via Google Fonts no index.html
- [x] Criar componente ProtectedRoute para rotas administrativas
- [x] Criar tela de login com visual institucional UFCA
- [x] Criar header público para página de cronograma
- [x] Reorganizar rotas no App.tsx com autenticação
- [x] Testar fluxo de autenticação completo


## Redesign da Página de Login (Estilo Manus)

- [x] Recriar LoginPage com design similar ao Manus (layout limpo, card centralizado)
- [x] Adicionar opções de login social (Facebook, Google, Microsoft, Apple)
- [x] Implementar opção de email/senha
- [x] Integrar com OAuth do Manus
- [x] Testar página de login completa


## Reorganização de Rotas (Nova Iteração)

- [x] Substituir rota /login para usar nova LoginPage
- [x] Fazer /cronograma a página inicial (/)
- [x] Adicionar header público com botão Admin no cronograma
- [x] Testar fluxo de navegação completo


## Redirecionamento e Links (Nova Iteração)

- [x] Redirecionar para /dashboard após login
- [x] Adicionar rota /cronograma apontando para CronogramaVisual
- [x] Adicionar link de Cronograma Visual no Dashboard
- [x] Testar fluxo completo


## Correção de Redirecionamento Pós-Login

- [x] Verificar fluxo de OAuth e callback
- [x] Configurar redirecionamento correto no callback para /dashboard
- [x] Testar fluxo de login completo


## Melhorias de Cronograma (Nova Iteração)

- [x] Corrigir exibição de múltiplos bolsistas no mesmo horário no dashboard
- [x] Atualizar schema para suportar horários específicos por dia da semana
- [x] Criar interface de cadastro de horários por dia (em vez de horário único para todos os dias)
- [x] Atualizar dashboard para exibir cronograma corrigido com múltiplos bolsistas
- [x] Testar funcionalidades de cronograma


## Bugs Reportados (Urgentes - Nova Iteração)

- [x] Dashboard não exibe bolsistas cadastrados - Bolsistas aparecem em /bolsistas mas não no dashboard - RESOLVIDO: Projeto de Cícero estava com ano 2025, atualizado para 2026

- [x] Cronograma visual não exibia bolsistas - Query estava buscando apenas bolsistaId 0 - RESOLVIDO: Criado endpoint getAll() e atualizado CronogramaVisual
- [x] Testes unitários para endpoints de horários - 10 testes criados e passando com sucesso


## Bugs Reportados - Análise com IA

- [x] Erro "pdftotext: not found" ao analisar frequência com IA - RESOLVIDO: Migrado para pdf-parse (npm package) - Não depende mais de pdftotext do sistema
- [x] Testes unitários para análise de frequência - 6 testes criados e passando com sucesso


## Bugs Reportados - Cronograma Visual

- [x] Bolsistas não estão sendo exibidos no cronograma visual - RESOLVIDO: Corrigido await em getAllHorarios() e getHorariosByBolsista(), adicionados dados de teste


## Bugs Reportados - Persistência de Bolsistas

- [x] Bolsistas cadastrados não persistem no banco de dados - RESOLVIDO: Corrigida função createBolsista para retornar ID corretamente
- [x] Cronograma não exibe múltiplos bolsistas no mesmo horário/local - CONFIRMADO: Funciona corretamente! Exibe 2+ bolsistas na mesma célula


## Novas Funcionalidades - Edição e Relatórios

- [x] Implementar edição de horários - RESOLVIDO: Adicionado endpoint update e interface de edição com botões de editar/salvar/cancelar
- [x] Criar relatório de ocupação de locais - RESOLVIDO: Página completa com gráficos de barras, pizza, tabela detalhada e exportção de PDF
- [x] Testes unitários para novas funcionalidades - 16 testes passando com sucesso


## Bugs Reportados - Análise IA JSON Inválido

- [x] Erro "Unexpected token, is not valid JSON" ao analisar documentos - RESOLVIDO: Melhorado tratamento de resposta do LLM com json_schema strict, melhor parsing e tratamento de erros

## Publicação do código-fonte no GitHub

- [x] Verificar conexão, privacidade e conteúdo atual do repositório YagoRod23/gerenciamento-bolsistas-ufca — conexão ativa; repositório alterado de público para privado; branch padrão atual: master
- [x] Gerar dump SQL publicável com estrutura e dados atuais das 10 tabelas — hashes de senha sanitizados conforme a auditoria de segurança
- [x] Auditar e remover segredos, credenciais, arquivos .env e artefatos internos do Manus — hashes de senha sanitizados e diretório .manus removido/ignorado
- [x] Documentar no repositório os campos sanitizados do dump e o procedimento de restauração
- [x] Preparar todos os arquivos atuais do projeto para a branch principal — snapshot limpo com 164 arquivos, testes e build aprovados
- [x] Obter confirmação antes de sobrescrever a branch principal, caso necessário — confirmação explícita recebida
- [x] Enviar código e dump ao repositório privado — branch master substituída após confirmação explícita
- [x] Validar o conteúdo publicado e confirmar o resultado — 164 arquivos, commit e SHA-256 do dump conferidos no GitHub
