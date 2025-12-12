# Limpeza do Projeto

O sistema foi migrado para **TypeScript** para maior estabilidade.
Você pode deletar com segurança os seguintes arquivos antigos (extensão .js e .jsx) na barra lateral de arquivos:

### Na pasta raiz:
- `vite.config.js` (O sistema usará vite.config.ts se este for deletado, mas deixei ele compatível por enquanto)
- `types.js`
- `index.jsx`
- `App.jsx`

### Na pasta components:
- `Sidebar.jsx`
- `ConfirmModal.jsx`
- `NotificationModal.jsx`
- `SetupModal.jsx`

### Na pasta context:
- `AppContext.jsx`

### Na pasta pages:
- `Dashboard.jsx`
- `Properties.jsx`
- `Leads.jsx`
- `Tasks.jsx`
- `Users.jsx`
- `Settings.jsx`
- `Rentals.jsx`
- `Sales.jsx`
- `PublicPage.jsx`
- `SuperAdmin.jsx`
- `LandingPage.jsx`
- `Login.jsx`

### Na pasta services:
- `db.js`
- `supabaseClient.js`

**Nota:** Eu já "desativei" o conteúdo desses arquivos para que o sistema funcione mesmo se você não os deletar agora.