# CRM Líder - ERP Imobiliário

Este é o sistema completo de gestão imobiliária com Inteligência Artificial integrada.

## 🚀 Como Rodar Localmente (No seu computador)

1.  **Instale as dependências:**
    ```bash
    npm install
    ```

2.  **Configure a IA (Google Gemini):**
    Crie um arquivo chamado `.env` na raiz do projeto e adicione sua chave:
    ```env
    VITE_API_KEY=sua_chave_aqui
    ```

3.  **Inicie o sistema:**
    ```bash
    npm run dev
    ```

---

## 🌐 Como Colocar Online (Deploy)

Para o sistema funcionar na internet (ex: Vercel), você precisa configurar as "chaves" no painel da hospedagem, pois o arquivo `.env` não é enviado por segurança.

### Passo a Passo na Vercel:

1.  Crie um novo projeto na Vercel e importe este repositório.
2.  Antes de clicar em "Deploy", procure a seção **Environment Variables**.
3.  Adicione as seguintes variáveis (Exatamente com estes nomes):

| Nome da Variável | Valor | Para que serve? |
| :--- | :--- | :--- |
| `VITE_API_KEY` | `sua_chave_do_gemini` | Ativa a Inteligência Artificial |
| `VITE_SUPABASE_URL` | `sua_url_supabase` | Conecta ao Banco de Dados |
| `VITE_SUPABASE_ANON_KEY` | `sua_key_supabase` | Permissão para acessar o Banco |

4.  Clique em **Deploy**.

> **Nota:** Se você esquecer de colocar a `VITE_API_KEY`, o sistema funcionará, mas os recursos de IA (Chat, Descrições e Matchmaking) ficarão desativados e mostrarão um aviso para configurar.

---

## 🛠️ Funcionalidades do Sistema

- **Dashboard**: Visão geral de VGV, comissões e tarefas.
- **Imóveis**: Cadastro completo com fotos, proprietários e geração de fichas PDF.
- **Leads (CRM)**: Gestão de clientes e funil de vendas.
- **IA Integrada**: 
  - Matchmaking automático de imóveis e clientes.
  - Chat "Tira-Dúvidas" jurídico e financeiro.
  - Recuperação de leads inativos.
- **WhatsApp**: Link direto para iniciar conversas.
- **Financeiro**: Controle de vendas e locações.
- **Site Público**: Página automática para visitantes.