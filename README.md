# 🧘 GastoZen - Controle Financeiro Sereno

Um aplicativo de gestão financeira pessoal leve, intuitivo e moderno desenvolvido com **React Native** e **Expo**. O foco do **GastoZen** é proporcionar tranquilidade financeira através de visões semanais dinâmicas, projeções automáticas de sobra ao fim do mês e controle diário de orçamento.

---

## ✨ Principais Funcionalidades

- **💵 Máscara Monetária Automática**: Campo de entrada estilo bancário com formatação instantânea, suporte a centavos e chips de incremento rápido.
- **📊 Previsão Inteligente de Fim de Mês**:
  - Estimativa de quanto vai sobrar no fechamento do mês com base na taxa de gasto diário.
  - Taxa de poupança estimada em tempo real com barra de progresso.
  - Meta de gasto diário limite recomendado para manter o orçamento equilibrado.
  - Resumo comparativo: Renda esperada vs. Gasto total previsto.
- **📅 Painel & Gráfico Semanal**:
  - Acompanhamento diário (Segunda a Domingo) com comparação visual entre despesas e receitas.
  - Identificação automática do dia de maior gasto.
  - Equivalência proporcional do salário por semana.
- **🥧 Gastos por Categoria**:
  - Distribuição percentual visual com ícones e cores temáticas por categoria.
  - Alternância entre visão semanal e mensal.
- **📜 Extrato Completo com Filtros**:
  - Busca instantânea por descrição ou categoria.
  - Filtros por período (*Este Mês*, *Esta Semana*, *Todos*) e tipo (*Todas*, *Despesas*, *Receitas*).
  - Toque para editar qualquer transação existente ou exclua com confirmação.
- **⚙️ Configuração de Salário & Metas**:
  - Suporte a salário mensal ou semanal com conversão instantânea.
  - Definição de meta de poupança mensal.
- **🌗 Tema Dinâmico Zen & Multi-Moedas**:
  - Alternância suave entre Modo Escuro (*Dark Zen*) e Modo Claro.
  - Suporte a BRL (R$), USD ($), EUR (€), GBP (£) e JPY (¥).
- **💾 Persistência Local**:
  - Armazenamento offline seguro utilizando AsyncStorage.

---

## 🚀 Tecnologias Utilizadas

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/) (SDK 54)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/)
- [@expo/vector-icons](https://icons.expo.fyi/) (Feather Icons)

---

## 📦 Como Executar o Projeto

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/vitormarcelo25/gasto-zen.git
   cd gasto-zen
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npx expo start
   ```

4. **Para testar no navegador (Web):**
   ```bash
   npx expo start --web
   ```

---

Desenvolvido para transformar a relação com suas finanças em uma experiência serena e consciente. 🌿
