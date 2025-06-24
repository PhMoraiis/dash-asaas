# Roteiro de Testes (Frontend + Backend)

### 1. Login e Autenticação
- [x] Tentar login com credenciais inválidas (mensagem de erro)
- [x] Login como admin (deve redirecionar para /pt/dashboard ou /en/dashboard)
- [ ] Login como revenda (deve redirecionar para dashboard da revenda)
- [ ] Logout (deve limpar sessão e redirecionar para login)

### 2. Proteção de Rotas
- [x] Acessar /dashboard sem estar autenticado (deve redirecionar para /pt/login)
- [ ] Acessar /admin/revendas como revenda (deve redirecionar para /dashboard)
- [ ] Acessar /admin/revendas como admin (deve acessar normalmente)
- [x] Acessar rotas públicas (login, register) autenticado (deve redirecionar para dashboard)

### 3. Refresh Token
- [ ] Expirar o token de acesso (simular expirando JWT)
- [ ] Tentar acessar rota protegida (deve renovar token automaticamente e permitir acesso)
- [ ] Expirar refresh token (remover do Redis) e tentar acessar rota protegida (deve forçar logout)

### 4. Internacionalização
- [x] Acessar / (deve redirecionar para /pt/login ou /en/login conforme idioma do navegador)
- [x] Trocar idioma manualmente na URL e verificar se textos mudam

### 5. Fluxos de Usuário
- [ ] Login como admin, acessar área de revendas, listar revendas
- [ ] Login como revenda, acessar dashboard, tentar acessar área de admin (deve ser bloqueado)
- [ ] Logout em ambos os casos

### 6. Testes de Integração Backend
- [ ] Testar endpoint /api/login com admin e revenda (200 e 401)
- [ ] Testar endpoint /api/refresh (com e sem refresh token válido)
- [ ] Testar endpoint /api/logout (deve limpar cookies e refresh do Redis)
- [ ] Testar rotas protegidas /private-test, /admin-only, /revenda-only com diferentes perfis