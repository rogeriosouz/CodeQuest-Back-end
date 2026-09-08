# 🚀 CodeQuest — Back-end

API responsável pelo back-end da **CodeQuest**, uma plataforma interativa de aprendizado de programação.

A plataforma permite que usuários estudem por meio de trilhas de aprendizado, resolvam desafios de programação e executem código diretamente no navegador, recebendo automaticamente os resultados dos testes.

O back-end foi desenvolvido com foco em **segurança, escalabilidade e processamento assíncrono**, utilizando Docker para isolamento das execuções e filas para processar tarefas de forma eficiente.

---

## ✨ Funcionalidades

- 🔐 Autenticação e autorização
- 👤 Gerenciamento de usuários
- 📚 Trilhas de aprendizado
- 🧩 Desafios de programação
- 🧪 Testes automatizados dos desafios
- 🐳 Execução isolada de código com Docker
- 📊 Sistema de progresso
- 🏆 Controle de conclusão dos desafios
- 🔄 Processamento assíncrono com BullMQ
- ⚡ Redis para gerenciamento de filas
- 📡 Comunicação em tempo real com Socket.IO
- 🗄️ Persistência de dados com PostgreSQL
- 🛡️ Validação de dados e controle de acesso

---

## 🏗️ Arquitetura

A execução dos desafios utiliza uma arquitetura assíncrona para evitar que a API fique bloqueada durante o processamento do código.

### Fluxo de execução

```text
┌─────────────┐
│    Usuário  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Front-end  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│     API     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    BullMQ   │
│    + Redis  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Worker   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Docker   │
│   Runner    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Execução   │
│   do código │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Resultado │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Socket.IO  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Front-end  │
└─────────────┘