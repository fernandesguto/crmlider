# CRM Líder - ERP Imobiliário

Este é o sistema completo de gestão imobiliária.

## 🔴 Como Corrigir o Erro "vite não é reconhecido"

O erro que você está vendo acontece porque as ferramentas do projeto ainda não foram instaladas no seu computador. Siga os passos abaixo na ordem exata:

### Passo 1: Instalar Dependências
Abra o terminal na pasta do projeto e execute:

```bash
npm install
```

*Aguarde terminar. Isso vai criar uma pasta chamada `node_modules`.*

### Passo 2: Gerar o Sistema (Build)
Agora que as ferramentas foram instaladas, execute o comando que estava dando erro:

```bash
npm run build
```

### Passo 3: Deploy (Hospedagem)
Ao final do passo 2, será criada uma pasta chamada **`dist`**.
É o conteúdo desta pasta `dist` que você deve enviar para sua hospedagem (Vercel, Netlify, Hostgator, etc).

---

## Funcionalidades do Sistema

- **Dashboard**: Visão geral de VGV, comissões e tarefas.
- **Imóveis**: Cadastro completo com fotos, proprietários e geração de fichas PDF.
- **Leads (CRM)**: Gestão de clientes e funil de vendas.
- **IA Integrada**: Matchmaking automático de imóveis e clientes.
- **WhatsApp**: Link direto para iniciar conversas.
- **Financeiro**: Controle de vendas e locações.
- **Site Público**: Página automática para visitantes.
