const express = require("express");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Netatmo API Credentials
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// Path to store tokens
const TOKEN_FILE_PATH = path.join(__dirname, 'netatmo_tokens.json');

// Middleware to format Netatmo response
app.use((req, res, next) => {
  res.formatNetatmoResponse = (data) => {
    return `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Netatmo Homes Data</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            background-color: #f4f4f4;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 20px;
            margin-bottom: 20px;
        }
        h1, h2 {
            color: #333;
        }
        .section {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 5px;
        }
        .subsection {
            background-color: #fff;
            border: 1px solid #e0e0e0;
            border-radius: 5px;
            padding: 10px;
            margin-bottom: 10px;
        }
        .label {
            font-weight: bold;
            color: #555;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Netatmo Homes Data</h1>
        
        <div class="section">
            <h2>Sistema</h2>
            <p><span class="label">Status:</span> ${data.status}</p>
            <p><span class="label">Tempo di Esecuzione:</span> ${data.time_exec} secondi</p>
            <p><span class="label">Ora Server:</span> ${new Date(data.time_server * 1000).toLocaleString()}</p>
        </div>

        ${data.body.homes.map((home, homeIndex) => `
        <div class="section">
            <h2>Casa ${homeIndex + 1}: ${home.name}</h2>
            
            <div class="subsection">
                <p><span class="label">ID:</span> ${home.id}</p>
                <p><span class="label">Posizione:</span> 
                    Altitudine: ${home.altitude}m, 
                    Coordinate: ${home.coordinates.join(', ')}, 
                    Paese: ${home.country}, 
                    Fuso Orario: ${home.timezone}
                </p>
            </div>

            <div class="subsection">
                <h3>Stanze</h3>
                ${home.rooms.map(room => `
                    <p><span class="label">${room.name}</span> (ID: ${room.id}, Tipo: ${room.type})</p>
                `).join('')}
            </div>

            ${home.schedules.map((schedule, scheduleIndex) => `
            <div class="subsection">
                <h3>Pianificazione ${scheduleIndex + 1}: ${schedule.name}</h3>
                <p>
                    <span class="label">ID:</span> ${schedule.id}<br>
                    <span class="label">Tipo:</span> ${schedule.type}<br>
                    <span class="label">Temperatura Assenza:</span> ${schedule.away_temp}°C<br>
                    <span class="label">Temperatura Antigelo:</span> ${schedule.hg_temp}°C
                </p>

                <h4>Zone Temperatura</h4>
                ${schedule.zones.map(zone => `
                    <div style="margin-bottom: 10px; padding: 5px; background-color: #f0f0f0; border-radius: 3px;">
                        <p><strong>${zone.name}</strong> (ID: ${zone.id}, Tipo: ${zone.type})</p>
                        ${zone.rooms.map(room => {
                            const roomDetails = home.rooms.find(r => r.id === room.id);
                            return `<p>
                                ${roomDetails ? roomDetails.name : 'Stanza'}: 
                                ${room.therm_setpoint_temperature}°C
                            </p>`;
                        }).join('')}
                    </div>
                `).join('')}
            </div>
            `).join('')}
        </div>
        `).join('')}

        <div class="section">
            <h2>Informazioni Utente</h2>
            <p><span class="label">Email:</span> ${data.body.user.email}</p>
            <p><span class="label">Lingua:</span> ${data.body.user.language}</p>
            <p><span class="label">Locale:</span> ${data.body.user.locale}</p>
            <p><span class="label">ID Utente:</span> ${data.body.user.id}</p>
        </div>
    </div>
</body>
</html>
    `;
  };
  next();
});

// Function to read tokens from local file
async function readTokensFromFile() {
  try {
    const data = await fs.readFile(TOKEN_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is invalid, return null
    return null;
  }
}

// Function to save tokens to local file
async function saveTokensToFile(tokens) {
  try {
    await fs.writeFile(TOKEN_FILE_PATH, JSON.stringify(tokens, null, 2));
  } catch (error) {
    console.error("Error saving tokens:", error);
  }
}

// Middleware to parse JSON bodies
app.use(express.json());

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Netatmo Dashboard</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            background-color: #f4f4f4;
            text-align: center;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 40px;
            margin-top: 50px;
        }
        h1 {
            color: #333;
            margin-bottom: 30px;
        }
        .btn {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 12px 24px;
            font-size: 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
            transition: background-color 0.3s;
        }
        .btn:hover {
            background-color: #45a049;
        }
        .success-message {
            background-color: #dff0d8;
            color: #3c763d;
            padding: 15px;
            margin-top: 20px;
            border-radius: 4px;
            display: none;
        }
        .error-message {
            background-color: #f2dede;
            color: #a94442;
            padding: 15px;
            margin-top: 20px;
            border-radius: 4px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Netatmo Dashboard</h1>
        <p>Per accedere ai dati di Netatmo, effettua il login con il tuo account Netatmo</p>
        
        <a href="/auth" class="btn" id="loginBtn">Login con Netatmo</a>
        
        <div id="successMessage" class="success-message">
            Login effettuato con successo! Reindirizzamento in corso...
        </div>
        
        <div id="errorMessage" class="error-message">
            Si è verificato un errore durante il login. Riprova.
        </div>
    </div>

    <script>
        // Controlla se l'utente è appena tornato dal flusso di autenticazione
        window.onload = function() {
            // Verifica se c'è un parametro di successo nell'URL
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('auth_success')) {
                document.getElementById('successMessage').style.display = 'block';
                document.getElementById('loginBtn').style.display = 'none';
                
                // Reindirizza a homesdata dopo un breve ritardo
                setTimeout(() => {
                    window.location.href = '/homesdata';
                }, 2000);
            }
            
            if (urlParams.has('auth_error')) {
                document.getElementById('errorMessage').style.display = 'block';
            }
        }
    </script>
</body>
</html>
  `);
});

// Generate authorization URL
app.get("/auth", (req, res) => {
  const authUrl = `https://api.netatmo.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=read_thermostat&response_type=code`;
  res.redirect(authUrl);
});

// Handle OAuth callback and token retrieval
app.get("/callback", async (req, res) => {
  const authCode = req.query.code;
  if (!authCode) {
    return res.redirect('/?auth_error=true');
  }

  try {
    const response = await axios.post("https://api.netatmo.com/oauth2/token", new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: authCode,
      redirect_uri: REDIRECT_URI
    }), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    const tokens = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
      obtained_at: Date.now()
    };

    // Save tokens to file
    await saveTokensToFile(tokens);

    // Reindirizza alla home con un parametro di successo
    res.redirect('/?auth_success=true');
  } catch (error) {
    console.error("Errore nel recupero del token:", error.response?.data || error);
    res.redirect('/?auth_error=true');
  }
});
// Function to refresh access token
async function refreshAccessToken() {
  try {
    // Read existing tokens
    const storedTokens = await readTokensFromFile();
    if (!storedTokens || !storedTokens.refresh_token) {
      throw new Error("No refresh token available");
    }

    const response = await axios.post("https://api.netatmo.com/oauth2/token", new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: storedTokens.refresh_token
    }), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    // Update tokens
    const newTokens = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
      obtained_at: Date.now()
    };

    // Save new tokens
    await saveTokensToFile(newTokens);

    return newTokens.access_token;
  } catch (error) {
    console.error("Errore nel refresh del token:", error.response?.data || error);
    throw error;
  }
}

// Endpoint to get homes data
app.get("/homesdata", async (req, res) => {
  try {
    // Read stored tokens
    const storedTokens = await readTokensFromFile();
    if (!storedTokens || !storedTokens.access_token) {
      return res.status(401).json({ error: "No access token available" });
    }

    // Check if token is expired (assuming it expires in 'expires_in' seconds)
    const isExpired = !storedTokens.obtained_at || 
      (Date.now() - storedTokens.obtained_at) / 1000 > storedTokens.expires_in;

    // Refresh token if needed
    const accessToken = isExpired ? await refreshAccessToken() : storedTokens.access_token;

    const response = await axios.get("https://api.netatmo.com/api/homesdata", {
      headers: {
        "accept": "application/json",
        "Authorization": `Bearer ${accessToken}`
      }
    });

    // Check if client wants HTML or JSON
    if (req.accepts('html')) {
      // Send formatted HTML
      res.send(res.formatNetatmoResponse(response.data));
    } else {
      // Send JSON
      res.json(response.data);
    }
  } catch (error) {
    console.error("Errore nel homesdata:", error.response?.data || error);
    res.status(500).json({ error: "Errore nel recupero dei dati" });
  }
});

// Endpoint to manually refresh token
app.get("/refresh", async (req, res) => {
  try {
    const newAccessToken = await refreshAccessToken();
    res.json({ access_token: newAccessToken });
  } catch (error) {
    res.status(500).json({ error: "Errore nel refresh del token" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
  console.log(`Ottieni Autorizzazione su http://localhost:${PORT}/auth`);
  console.log(`Ottieni Dati su http://localhost:${PORT}/homesdata`);
});