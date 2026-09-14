# Sistema de Gerenciamento de Bolsistas (SGB)

Sistema web completo para gerenciamento de bolsistas, projetos, documentos e pagamentos.

## 🚀 Funcionalidades

- ✅ Dashboard com estatísticas em tempo real
- ✅ CRUD completo de Projetos
- ✅ CRUD completo de Bolsistas
- ✅ Gerenciamento de Documentos com upload de PDFs
- ✅ Controle de Pagamentos
- ✅ Relatórios e gráficos
- ✅ Exportação para Excel

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta Manus (para usar o banco de dados e armazenamento)

## 🔧 Instalação

### 1. Instalar dependências

```bash
npm install
# ou
pnpm install
```

### 2. Configurar variáveis de ambiente

O projeto já vem configurado com as credenciais da Manus. Se você quiser rodar localmente com seu próprio banco de dados, crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL=sua_connection_string_mysql
JWT_SECRET=seu_secret_aqui
```

### 3. Aplicar schema do banco de dados

```bash
pnpm db:push
```

### 4. Iniciar o servidor de desenvolvimento

```bash
pnpm dev
```

O sistema estará disponível em: `http://localhost:3000`

## 📁 Estrutura do Projeto

```
sgb-simples/
├── client/              # Frontend React
│   └── src/
│       ├── pages/       # Páginas do sistema
│       ├── components/  # Componentes reutilizáveis
│       └── lib/         # Configurações (tRPC, etc)
├── server/              # Backend Node.js
│   ├── routers.ts       # Rotas da API (tRPC)
│   ├── db.ts            # Funções de banco de dados
│   └── upload.ts        # Upload de arquivos
├── drizzle/             # Schema do banco de dados
│   └── schema.ts        # Definição das tabelas
└── shared/              # Código compartilhado
```

## 🗄️ Banco de Dados

O sistema usa **MySQL/TiDB** com as seguintes tabelas:

- `projetos` - Projetos cadastrados
- `bolsistas` - Bolsistas vinculados a projetos
- `documentos` - Documentos enviados (frequências e relatórios)
- `controle_pagamentos` - Controle de pagamentos mensais

## 📤 Upload de Arquivos

Os arquivos PDF são armazenados em **S3 (Amazon)** através da API da Manus. A URL do arquivo é salva no banco de dados.

## 🎨 Tecnologias Utilizadas

- **Frontend**: React 19, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express, tRPC
- **Banco de Dados**: MySQL (via Drizzle ORM)
- **Armazenamento**: S3 (via Manus)

## 📊 Páginas Disponíveis

- `/` - Dashboard com estatísticas
- `/projetos` - Gerenciar projetos
- `/bolsistas` - Gerenciar bolsistas
- `/documentos` - Validar e gerenciar documentos
- `/pagamentos` - Controle de pagamentos
- `/relatorios` - Relatórios e gráficos

## 🔐 Autenticação

O sistema usa autenticação OAuth da Manus. Para desenvolvimento local, você pode desabilitar a autenticação ou configurar seu próprio OAuth.

## 📝 Scripts Disponíveis

```bash
pnpm dev          # Inicia servidor de desenvolvimento
pnpm build        # Compila para produção
pnpm db:push      # Aplica schema no banco de dados
pnpm db:studio    # Abre interface visual do banco
```

## 🐛 Solução de Problemas

### Erro de conexão com banco de dados

Verifique se a variável `DATABASE_URL` está configurada corretamente no `.env`

### Erro ao fazer upload de arquivos

Certifique-se de que as credenciais da Manus estão configuradas corretamente.

### Porta 3000 já está em uso

Altere a porta no arquivo `vite.config.ts`:

```ts
server: {
  port: 3001 // ou outra porta disponível
}
```

## 📧 Suporte

Para dúvidas ou problemas, entre em contato através do chat da Manus.

## 📄 Licença

Este projeto foi criado pela Manus AI para uso pessoal.

