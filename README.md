# WeDo - Frontend

Este é o repositório frontend da plataforma **WeDo**, uma aplicação web focada na colaboração de equipas (Squads), gestão de atividades (Actions) e interação entre a comunidade (Amigos).

O projeto foi construído com foco em performance, modularidade e uma interface de utilizador limpa e reativa.

## Tecnologias Utilizadas

* **[React](https://react.dev/):** Biblioteca principal para construção da interface.
* **[TypeScript](https://www.typescriptlang.org/):** Adiciona tipagem estática ao JavaScript para maior segurança e facilidade de manutenção.
* **[Vite](https://vitejs.dev/):** Ferramenta de build e servidor de desenvolvimento ultra-rápido.
* **[Tailwind CSS](https://tailwindcss.com/):** Framework de CSS utilitário utilizado para todo o design e animações da interface.

## Pré-requisitos

Antes de começares, certifica-te de que tens instalado na tua máquina:
* **Node.js** (versão 18 ou superior)
* **O Backend do WeDo** (`projeto-asw-main`) configurado e a correr localmente.

> **Importante:** O Frontend assume que a API do Backend está a correr no endereço `http://localhost:3000`. Se o backend não estiver ativo, não conseguirás fazer login ou carregar dados.

## Instalação e Execução (Local)

Para correres este projeto no teu computador, segue estes passos no teu terminal:

1. **Navega para a pasta do projeto:**
   ```bash
   cd wedo-frontend
   ```

2. **Instala as dependências:**
   Isto irá descarregar o React, Tailwind e todas as ferramentas necessárias.
   ```bash
   npm install
   ```

3. **Inicia o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Abre a aplicação:**
   O terminal irá mostrar um link (geralmente `http://localhost:5173`). Clica nele ou copia para o teu browser favorito.

## Estrutura Principal do Projeto

O código está organizado de forma modular dentro da pasta `src/components/`, separando cada secção para facilitar a manutenção:

* `UserPortal.tsx`: O "cérebro" da interface que gere a navegação (Sidebar) e decide qual o ecrã a mostrar.
* `user/UserProfile.tsx`: Edição de dados do utilizador, alteração de cor de perfil, e exibição de XP e Streak.
* `user/UserSquads.tsx`: Pesquisa, criação e gestão de grupos, incluindo a visualização de membros e Actions ativas.
* `user/UserActions.tsx`: Visão global de todas as missões e tarefas agrupadas pelos Squads do utilizador.
* `user/UserFriends.tsx`: O diretório geral de todos os membros da comunidade WeDo.

## Comandos Úteis

* `npm run dev` - Inicia o servidor local para desenvolvimento com Hot-Module-Replacement (HMR).
* `npm run build` - Compila o projeto para produção (gera a pasta `dist` com os ficheiros otimizados).
* `npm run lint` - Corre o ESLint para encontrar e corrigir problemas no código TypeScript/React.