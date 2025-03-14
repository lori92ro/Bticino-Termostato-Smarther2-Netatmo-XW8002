# Bticino Termostato Smarther2 Netatmo XW8002

Questo progetto implementa un'interfaccia web per interagire con i termostati Bticino Smarther2 (modello XW8002) tramite le API Netatmo.

## Prerequisiti

- Node.js (consigliato v12 o superiore)
- Un account Netatmo
- Credenziali API Netatmo (CLIENT_ID e CLIENT_SECRET)

## Configurazione

1. Crea una copia del file `default.env` e rinominala in `.env`:
   ```bash
   cp default.env .env
   ```

2. Modifica il file `.env` inserendo le tue credenziali Netatmo:
   ```
   CLIENT_ID=tuo_client_id
   CLIENT_SECRET=tua_client_secret
   REDIRECT_URI=http://localhost:3000/callback
   PORT=3000
   ```

   > Nota: Per ottenere CLIENT_ID e CLIENT_SECRET è necessario registrare un'applicazione nel [portale sviluppatori Netatmo](https://dev.netatmo.com/).

## Installazione

Installa le dipendenze necessarie con:

```bash
npm install
```

## Avvio del servizio

Avvia il server con:

```bash
npm start
```

Una volta avviato, il server sarà accessibile all'indirizzo `http://localhost:3000` (o sulla porta specificata nel file `.env`).

## Utilizzo

1. Apri il browser e visita `http://localhost:3000`
2. Clicca su "Login con Netatmo" per autenticarti con il tuo account Netatmo
3. Dopo l'autenticazione, verrai reindirizzato automaticamente alla pagina con i dati dei tuoi termostati

## Funzionalità

- Visualizzazione dei dati delle case e dei termostati associati
- Informazioni dettagliate su stanze, programmi e temperature impostate
- Refresh automatico del token di autenticazione
- Supporto per output in formato HTML e JSON

## Endpoint API

- `/` - Homepage con pulsante di login
- `/auth` - Inizia il processo di autenticazione OAuth con Netatmo
- `/callback` - Endpoint per la gestione del callback OAuth
- `/homesdata` - Recupera e visualizza i dati delle case e dei termostati
- `/refresh` - Aggiorna manualmente il token di accesso

## Note sulla sicurezza

- I token di autenticazione vengono salvati localmente nel file `netatmo_tokens.json`
- Il refresh token viene utilizzato per rinnovare automaticamente l'accesso quando necessario
- Il file `.env` e `netatmo_tokens.json` sono esclusi dal controllo versione tramite `.gitignore` per proteggere le credenziali

## Struttura del progetto

- `server.js` - Il file principale del server Express
- `.env` - Contiene variabili d'ambiente e credenziali
- `default.env` - Template per il file .env
- `netatmo_tokens.json` - Memorizza i token di autenticazione
- `package.json` - Definizione del progetto e dipendenze