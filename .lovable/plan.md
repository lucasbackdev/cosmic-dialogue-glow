## Fase 1 — Histórico de Conversas (agora)
- Criar tabelas no Supabase para conversas e mensagens
- Adicionar autenticação (login) para identificar o usuário
- Sidebar com lista de conversas antigas por data
- Salvar todas as mensagens automaticamente

## Fase 2 — Painel CRM Translúcido (agora)
- Painel lateral esquerdo translúcido/transparente sobre o fundo estrelado
- Aparece quando a IA detecta que você está perguntando sobre métricas ou campanhas
- Cards com métricas: impressões, cliques, CTR, CPC, conversões, custo
- Por enquanto com dados de exemplo até conectar o Google Ads

## Fase 3 — Google Ads API (precisa das credenciais)
- Criar edge function para autenticação OAuth2 com Google
- Conectar à API do Google Ads para buscar dados reais
- IA com acesso total: criar, pausar, editar campanhas, grupos, anúncios
- Análise de palavras-chave, orçamentos, lances

**Pergunta:** Você já tem uma conta de desenvolvedor do Google Ads com Developer Token aprovado? Sem isso, a Fase 3 não é possível.

Posso começar as Fases 1 e 2 agora enquanto você configura o acesso ao Google Ads.