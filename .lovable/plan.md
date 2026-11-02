# Patrion — Atualização Premium (em etapas)

## Diagnóstico técnico atual
- App financeiro com Início, Movimentações, Assistente, Conta e Admin; backend, login por convite e confirmação de lançamentos já funcionam.
- **Causa do erro "sem conexão" no chat**: qualquer falha (limite de uso, sessão expirada, erro do serviço de IA, resposta inválida) cai em um único bloco que sempre mostra "Sem conexão" / "Confira a conexão". Não é a internet do usuário.
- Sessão já fica salva no aparelho, mas não há opção "Permanecer conectado" nem recuperação de senha completa.
- Não existem PWA, tela offline, abertura animada própria, transições entre abas nem feedback.
- Não existem: sites, projetos, clientes, contratos, assinaturas, PDFs, arquivos. Serão módulos novos.
- Chat aleatório: adiado, conforme sua resposta.

## Etapa 1 — Estabilidade e chat (prioridade)
- Classificar erros: sem internet, servidor fora, IA fora, sessão expirada, limite, tempo esgotado, resposta inválida — cada um com mensagem real.
- Logs com ID de correlação (sem conteúdo privado), botão "Tentar novamente", mensagem pendente preservada, estados "enviando" e "pensando".

## Etapa 2 — Login e sessão
- Nova tela de login premium: símbolo animado, mostrar senha, "Permanecer conectado", "Esqueci a senha" + página de nova senha, erros claros.
- Sessão persistente com renovação automática; sai só ao clicar em Sair.

## Etapa 3 — Abertura, fundo e transições
- Abertura com o símbolo (escala, opacidade, profundidade), rápida quando já carregado.
- Fundo dourado discreto em movimento lento; respeita redução de movimento.
- Transição suave entre abas sem recarregar.

## Etapa 4 — PWA
- Manifesto, ícones, modo janela própria, cache seguro, tela offline, "Instalar aplicativo" na Conta (Android nativo, instruções no iPhone), sem repetir aviso. Funciona só no app publicado.

## Etapa 5 — Fixos e evolução
- Gastos fixos e **ganhos fixos** mensais (mesmo valor, mesmo dia), em uma aba própria "Fixos" dentro de Movimentações.
- Aba "Evolução": quanto a pessoa melhorou (gasto mês a mês, economia, constância de registros) com dados reais.
- Dashboard: símbolo, saudação, "Desenvolvido por Samuel J.M.", cards de prévia que levam às áreas reais.

## Etapa 6 — Feedback
- "Feedback e melhorias" na Conta (tipo, título, descrição, área, nota). Admin vê, muda status (Recebido → Não planejado) e responde.

## Etapa 7+ — Novos módulos (um por vez)
Clientes e projetos → Contratos + assinatura eletrônica simples → Exportar PDF → Arquivos (envio, download, limite de tamanho) → Criação de sites com IA.
Cada módulo terá banco próprio com acesso só do dono e será testado antes do próximo.

## Testes
Ao fim de cada etapa: testes automáticos das regras, verificação navegando logado, celular e desktop, relatório do que passou e do que falta.
