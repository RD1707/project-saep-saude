# Projeto SAEPSaude - Backend e Frontend Integrado

Este projeto implementa uma aplicação web single page (SPA) para entusiastas de atividades físicas, permitindo o registro, listagem e interação (curtidas e comentários) com atividades, além de visualização de métricas. O backend é desenvolvido com Node.js, Express e Sequelize (com SQLite), servindo uma API REST. O frontend (HTML, CSS, JavaScript) é servido diretamente pelo backend.

## Funcionalidades

### Backend
-   **Autenticação**: Login de usuários com JWT e proteção de senhas com bcrypt.
-   **Usuários**: Gerenciamento de dados de usuário, incluindo nome, email, senha, foto e tipo.
-   **Empresa**: Armazena métricas agregadas (total de atividades, total de calorias).
-   **Atividades**: CRUD de atividades com tipo, título, distância, duração, calorias e data de criação.
-   **Likes**: Sistema de curtidas com restrição de uma curtida por usuário por atividade.
-   **Comentários**: Sistema de comentários para atividades.
-   **Importação de Dados**: Rotina inicial para importar dados de `usuarios.csv` e `atividades.csv`, preenchendo o banco de dados e calculando métricas iniciais.
-   **API REST**: Endpoints para todas as funcionalidades, com validação de dados e mensagens de erro específicas.
-   **Serviço de Frontend**: O backend serve os arquivos estáticos do frontend (HTML, CSS, JS).

### Frontend (SPA)
-   Interface de usuário para registrar e listar atividades.
-   Interação com curtidas e comentários.
-   Visualização de métricas da empresa e do usuário.

## Estrutura do Projeto

```
.
├── assets/
│   ├── arquivos_CSV/           # Arquivos CSV para importação inicial
│   ├── icones/                 # Ícones utilizados
│   ├── imagens_perfil/         # Imagens de perfil de usuário
│   └── logo_saepsaude/         # Logo da empresa
├── middleware/
│   └── auth.js                 # Middleware para autenticação JWT
├── routes/
│   ├── activities.js           # Rotas para atividades e likes
│   ├── auth.js                 # Rotas para autenticação de usuário
│   └── comments.js             # Rotas para comentários
├── utils/
│   └── importData.js           # Script para importação inicial de dados
├── .env.example                # Exemplo de arquivo de variáveis de ambiente
├── .env                        # Variáveis de ambiente (excluído do git)
├── db.js                       # Configuração do Sequelize e definição dos modelos
├── index.js                    # Ponto de entrada da aplicação Express e servidor de frontend
├── package.json                # Dependências e scripts do projeto
├── package-lock.json
├── database.sqlite             # Banco de dados SQLite (gerado automaticamente)
└── index.html                  # Arquivo HTML do frontend
└── style.css                   # Arquivo CSS do frontend
└── script.js                   # Arquivo JavaScript do frontend
```

## Como Rodar o Projeto

Siga os passos abaixo para configurar e executar a aplicação.

### 1. Pré-requisitos

Certifique-se de ter o [Node.js](https://nodejs.org/en/) (versão 14 ou superior) instalado em sua máquina.

### 2. Instalação das Dependências

No diretório raiz do projeto, abra o terminal e instale as dependências:

```bash
npm install
```

### 3. Configuração do Ambiente

Crie um arquivo `.env` na raiz do projeto (se ele ainda não existir). Este arquivo armazenará variáveis de ambiente sensíveis. A única variável obrigatória é `JWT_SECRET`. Você pode copiar o `.env.example` e preencher com seus dados:

```ini
JWT_SECRET=sua_chave_secreta_jwt_aqui
```

**Importante**: `JWT_SECRET` deve ser uma string longa e aleatória para garantir a segurança dos tokens JWT.

### 4. Executando a Aplicação

Para iniciar o servidor backend e servir o frontend, execute o seguinte comando no terminal na raiz do projeto:

```bash
npm start
```

O servidor será iniciado e você poderá acessar a aplicação completa em seu navegador:

[http://nplocalhost:3000](http://localhost:3000)

### 5. Importação Inicial de Dados

Na primeira vez que você rodar a aplicação, o backend irá automaticamente:
1.  Sincronizar o banco de dados (criando as tabelas se não existirem).
2.  Importar os dados dos arquivos `assets/arquivos_CSV/usuario.csv` e `assets/arquivos_CSV/atividade.csv` para o banco de dados `database.sqlite`.
3.  Calcular e atualizar as métricas iniciais da empresa e dos usuários.

Se o banco de dados já contiver dados (por exemplo, após uma execução anterior), a importação inicial será ignorada.

### 6. Acessando a Aplicação

Após iniciar o servidor (`npm start`), abra seu navegador e navegue para `http://localhost:3000`. Você terá acesso ao frontend da aplicação, que se comunicará com o backend rodando na mesma porta.

---

Espero que isso ajude a configurar e testar o projeto!
