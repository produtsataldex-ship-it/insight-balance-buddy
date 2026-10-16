# Patrion v2.0: experiência e assistente

## O que muda para o usuário

1. **Boas-vindas**
   - Um aviso discreto aparece no primeiro acesso e depois de 7 dias sem usar o app, mostrando o que dá para fazer: falar um gasto, ver o saldo e perguntar ao assistente.
   - Quem ainda não registrou nada vê no Início e em Movimentações sugestões tocáveis com as categorias padrão (Mercado, Transporte…), que já abrem o registro com aquela categoria escolhida.

2. **Saldo único e claro**
   - O cartão do patrimônio mostra um só valor principal: o saldo disponível (receitas pagas menos despesas pagas; transferências não contam).
   - Abaixo dele aparece, em tom secundário, o "Previsto no fim do mês", marcado como estimativa. Os outros números repetidos saem desse cartão.

3. **Fundo dourado animado no patrimônio**
   - Um brilho dourado suave e lento atrás do saldo, no estilo Apple. Ele fica parado quando o aparelho pede menos movimento.

4. **Toque e segure para falar**
   - O cartão do saldo mostra o texto "Toque e segure para falar". Enquanto você segura, aparece uma onda animada com "Registrando…". Ao soltar, o que você falou vai para o assistente.
   - Um ícone de teclado discreto ao lado abre o registro digitado.
   - O botão dourado grande atual sai da tela.

5. **Cores por categoria**
   - Cada categoria ganha uma cor própria, que você pode escolher em Minha conta. A cor aparece no ícone, no gráfico de pizza, na lista e no topo do formulário quando você escolhe a categoria.
   - As cores seguem a família dourado, âmbar, cobre, bronze e neutros, sem verde.
   - Ao tocar, os botões de categoria dão uma pequena "mola". Ao abrir ou criar uma categoria, a tela entra deslizando de leve.

6. **Assistente v2**
   - Cada vez que você abre o Assistente, começa uma conversa nova e limpa.
   - Um botão "Histórico" lista as conversas anteriores, que ficam salvas e podem ser abertas, renomeadas ou apagadas.
   - Conversa em estilo mensageiro, com horário em cada mensagem, indicador "pensando…" e rolagem suave.
     - Seus balões ficam em dourado à direita e os do assistente em cinza-escuro à esquerda. Não usamos verde, por causa da regra do Patrion.
   - As respostas ficam mais detalhadas e citam seus números reais. Quando ajuda, trazem uma tabela ou um mini gráfico, além de 2 ou 3 sugestões de próxima pergunta que você pode tocar.
   - Registro por voz ou texto: o assistente mostra um cartão com o lançamento dentro da conversa. Você toca em "Confirmar" (ou corrige) e o assistente responde "Despesa de R$50,00 em Alimentação registrada". A confirmação continua obrigatória, para nunca salvar algo errado ou duplicado.
   - Revisão de falhas: manter o texto digitado quando der erro, botão de tentar de novo, evitar respostas duplicadas e não deixar o "pensando…" travado.

## Limites (ser transparente)
- O Patrion é um app web que roda no navegador e pode ser instalado na tela inicial do celular. Não vou criar versões nativas em Swift ou Kotlin.
- A voz usa o reconhecimento do próprio navegador. Ele funciona no Chrome e no Safari. Onde não funcionar, o teclado continua disponível.

## Detalhes técnicos
- Migração:
  - `categories.color text` (com CHECK de hex e cores padrão nas categorias existentes).
  - Nova tabela `assistant_threads(id, user_id, title, created_at, updated_at)` com RLS para o dono e GRANTs.
  - `assistant_messages.thread_id uuid`: as mensagens antigas vão para uma conversa "Conversa anterior" por usuário.
  - `profiles.welcome_seen_at`.
- Rotas: `/assistente` cria uma conversa e navega para `/assistente/$threadId`. Há também `/assistente/historico`. O ID da conversa vem da rota e o histórico é escopado por conversa.
- `askAssistant` recebe `threadId`, verifica se a conversa é do usuário e lê só o histórico dela. O schema de saída ganha `suggestions[]` e `table|chart` opcionais e validados. A chave de idempotência continua igual.
- Interface do chat com primitivos AI Elements, nos tokens do tema.
- Toque e segure: pointerdown/up com `use-voice-input`, cancelando se o dedo sair. Inclui uma alternativa de teclado acessível (Espaço segurado).
- Testes: paleta de categorias sem verde, regra de inatividade de 7 dias, schema de sugestões e regra do saldo consolidado.
