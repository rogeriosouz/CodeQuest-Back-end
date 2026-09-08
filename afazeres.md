# 🚀 Plataforma de Desafios de Programação

Uma plataforma de desafios de programação com ranking, gamificação e desafios entre usuários.

---

# 📌 Objetivo do Projeto

Criar uma plataforma onde programadores possam:

- Resolver desafios de programação
- Ganhar pontos
- Subir no ranking
- Competir com outros usuários
- Melhorar habilidades técnicas

---

# 🧱 Stack Tecnológica

## Frontend

- Next.js
- React
- TypeScript
- TailwindCSS

## Backend

- NestJS
- Node.js

## Banco de dados

- PostgreSQL

## Cache / Ranking

- Redis

## Tempo real (duelos)

- Socket.io

---

# 📍 Roadmap de Desenvolvimento

---

# Fase 1 — Base do Projeto (MVP)

Objetivo: ter a plataforma funcionando com desafios e ranking.

## 1. Autenticação de usuários

Criar sistema de autenticação.

Funcionalidades:

- Cadastro
- Login
- Logout
- Refresh Token
- Proteção de rotas

Campos do usuário:

- id
- name
- email
- password
- created_at

---

## 2. Sistema de Desafios

Criar desafios de programação.

Campos do desafio:

- id
- title
- description
- difficulty
- language
- points
- created_at

Exemplo:

Título: Soma de Dois Números
Dificuldade: Fácil
Pontos: 10

---

## 3. Sistema de Respostas

Usuário envia resposta para o desafio.

Campos:

- id
- user_id
- challenge_id
- code
- status (correct / incorrect)
- created_at

Regras:

- verificar resposta
- marcar como correta
- adicionar pontos ao usuário

---

## 4. Sistema de Pontos

Cada desafio tem pontos.

Quando o usuário acerta:

- soma pontos ao usuário

Tabela:

user_points

Campos:

- user_id
- total_points

---

## 5. Ranking Global

Criar leaderboard.

Ranking baseado em:

total_points

Exemplo:

1º João — 1500 pontos
2º Maria — 1200 pontos
3º Carlos — 900 pontos

Redis pode ser usado para ranking rápido.

---

# Fase 2 — Gamificação

Objetivo: aumentar engajamento.

## 1. Sistema de níveis

Exemplo:

0–100 pontos → Level 1
100–500 → Level 2
500–1000 → Level 3

---

## 2. Sistema de conquistas

Exemplos:

🏆 Primeiro desafio resolvido
🏆 10 desafios resolvidos
🏆 50 desafios resolvidos

Tabela:

achievements

---

## 3. Streak de desafios

Contar dias seguidos resolvendo desafios.

Exemplo:

🔥 7 dias seguidos

---

# Fase 3 — Desafios entre Usuários

Objetivo: competição.

Funcionalidades:

- convidar amigo
- iniciar desafio
- tempo limite
- comparar resultados

Fluxo:

1 usuário desafia outro
2 ambos recebem perguntas
3 quem acertar mais ganha

Recompensa:

- pontos extras
- vitória no perfil

---

# Fase 4 — Perfil Público

Cada usuário terá uma página.

Exemplo:

/user/rogerio

Informações:

- pontos
- ranking
- desafios resolvidos
- vitórias em duelos
- conquistas

---

# Fase 5 — Monetização

Possíveis formas de ganhar dinheiro.

## Plano Premium

Benefícios:

- desafios avançados
- estatísticas detalhadas
- competições exclusivas
- ranking avançado

---

## Torneios

Exemplo:

Torneio mensal

- inscrição: R$10
- prêmio para vencedores

---

## Empresas

Empresas podem:

- criar desafios
- buscar talentos
- ver ranking dos melhores usuários

---

# 📊 Futuras Funcionalidades

- editor de código online
- suporte a várias linguagens
- testes automáticos
- competições ao vivo
- ranking semanal
- desafios patrocinados por empresas

---

# 🎯 MVP Inicial

Primeira versão deve ter:

✔ Login
✔ Lista de desafios
✔ Resolver desafio
✔ Ganhar pontos
✔ Ranking global

---

# 🧠 Objetivo final

Criar uma comunidade onde programadores possam:

- aprender
- competir
- melhorar habilidades
- mostrar conhecimento para empresas

---
