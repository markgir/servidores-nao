# servidores-nao

Monitor de Servidores — Backoffice para monitorização de endereços IP e domínios (incluindo DDNS).

## Funcionalidades

- Adicionar/remover endereços IP ou domínios para monitorização
- Verificação automática de estado online/offline via ping (a cada 5 segundos)
- Luz verde pulsante para servidores online
- Luz vermelha pulsante para servidores offline
- Gráfico de linha de vida (heartbeat) mostrando tempos de resposta em milissegundos
- Layout com tema verde degradê inspirado na GNR

## Instalação

```bash
npm install
```

## Utilização

```bash
npm start
```

Aceder a `http://localhost:3000` no navegador.

## Testes

```bash
npm test
```

## Estrutura

```
├── server.js              # Servidor Express (API + ficheiros estáticos)
├── data/store.js          # Camada de dados (JSON file)
├── services/ping.js       # Serviço de ping
├── public/
│   ├── index.html         # Página principal
│   ├── css/style.css      # Estilos (tema verde degradê)
│   └── js/app.js          # Aplicação frontend
└── test/                  # Testes
```