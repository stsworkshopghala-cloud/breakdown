import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { google } from "googleapis";
import cookieSession from "cookie-session";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(
  cookieSession({
    name: "sts-session",
    keys: [process.env.SESSION_SECRET || "default-secret-do-not-use"],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: true,
    sameSite: "none",
  })
);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.APP_URL || "http://localhost:3000"}/auth/google/callback`
);

// Auth Routes
app.get("/api/auth/google/url", (req, res) => {
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });

  res.json({ url });
});

app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    req.session!.tokens = tokens;

    // Get user info to show in the UI
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    req.session!.user = userInfo.data;

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error exchanging code for tokens", error);
    res.status(500).send("Authentication failed");
  }
});

app.get("/api/user", (req, res) => {
  res.json({ user: req.session?.user || null });
});

app.post("/api/logout", (req, res) => {
  req.session = null;
  res.json({ success: true });
});

// Sheet Logic
const SPREADSHEET_NAME = "STS_Breakdown_Log";

async function getSpreadsheetId(auth: any) {
  const drive = google.drive({ version: "v3", auth });
  const response = await drive.files.list({
    q: `name = '${SPREADSHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`,
    fields: "files(id, name)",
    spaces: "drive",
  });

  const files = response.data.files;
  if (files && files.length > 0) {
    return files[0].id;
  }

  // Create if not exists
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: SPREADSHEET_NAME,
      },
      sheets: [
        {
          properties: {
            title: "Data",
          },
        },
      ],
    },
  });

  const id = spreadsheet.data.spreadsheetId;
  
  // Add headers
  await sheets.spreadsheets.values.update({
    spreadsheetId: id!,
    range: "Data!A1",
    valueInputOption: "RAW",
    requestBody: {
      values: [
        [
          "SR NO",
          "FLEET NO",
          "MAKE MODEL",
          "REPAIR TYPE",
          "REPAIR DESCRIPTION",
          "DATE BD",
          "DATE IN",
          "REPAIR LOCATION",
          "BRANCH PLANT",
          "STATUS",
          "REMARKS",
          "NORMAL BD DAYS",
          "SPECIAL BD DAYS",
          "TOTAL BD DAYS",
          "UPDATED AT",
          "UPDATED BY"
        ],
      ],
    },
  });

  return id;
}

app.get("/api/vehicles", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Unauthorized" });

  try {
    oauth2Client.setCredentials(req.session.tokens);
    const spreadsheetId = await getSpreadsheetId(oauth2Client);
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId!,
      range: "Data!A2:P",
    });

    const rows = response.data.values || [];
    const vehicles = rows.map((row) => ({
      srNo: Number(row[0]),
      fleetCode: row[1],
      makeModel: row[2],
      repairType: row[3],
      repairDescription: row[4],
      dateBD: row[5],
      dateIn: row[6],
      repairLocation: row[7],
      branchPlant: row[8],
      status: row[9],
      remarks: row[10],
      normalBDDays: Number(row[11]),
      specialBDDays: Number(row[12]),
      totalBDDays: Number(row[13]),
      updatedAt: row[14],
      updatedBy: row[15],
    }));

    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles from sheet", error);
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
});

app.post("/api/vehicles", async (req, res) => {
  if (!req.session?.tokens) return res.status(401).json({ error: "Unauthorized" });

  try {
    const vehicle = req.body;
    oauth2Client.setCredentials(req.session.tokens);
    const spreadsheetId = await getSpreadsheetId(oauth2Client);
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    // Find if vehicle exists (by Fleet No in column B)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId!,
      range: "Data!B:B",
    });

    const fleetCodes = response.data.values || [];
    let rowIndex = -1;
    for (let i = 1; i < fleetCodes.length; i++) {
        if (fleetCodes[i][0] === vehicle.fleetCode) {
            rowIndex = i + 1;
            break;
        }
    }

    const rowValue = [
      vehicle.srNo,
      vehicle.fleetCode,
      vehicle.makeModel,
      vehicle.repairType,
      vehicle.repairDescription,
      vehicle.dateBD,
      vehicle.dateIn,
      vehicle.repairLocation,
      vehicle.branchPlant,
      vehicle.status,
      vehicle.remarks,
      vehicle.normalBDDays,
      vehicle.specialBDDays,
      vehicle.totalBDDays,
      new Date().toISOString(),
      req.session.user.email
    ];

    if (rowIndex !== -1) {
      // Update
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId!,
        range: `Data!A${rowIndex}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [rowValue],
        },
      });
    } else {
      // Append
      await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId!,
        range: "Data!A1",
        valueInputOption: "RAW",
        requestBody: {
          values: [rowValue],
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error saving vehicle to sheet", error);
    res.status(500).json({ error: "Failed to save vehicle" });
  }
});

app.delete("/api/vehicles/:fleetCode", async (req, res) => {
    if (!req.session?.tokens) return res.status(401).json({ error: "Unauthorized" });

    try {
        const { fleetCode } = req.params;
        oauth2Client.setCredentials(req.session.tokens);
        const spreadsheetId = await getSpreadsheetId(oauth2Client);
        const sheets = google.sheets({ version: "v4", auth: oauth2Client });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId!,
            range: "Data!B:B",
        });

        const fleetCodes = response.data.values || [];
        let rowIndex = -1;
        for (let i = 1; i < fleetCodes.length; i++) {
            if (fleetCodes[i][0] === fleetCode) {
                rowIndex = i; // 0-indexed for batchUpdate
                break;
            }
        }

        if (rowIndex !== -1) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: spreadsheetId!,
                requestBody: {
                    requests: [
                        {
                            deleteDimension: {
                                range: {
                                    sheetId: 0,
                                    dimension: "ROWS",
                                    startIndex: rowIndex,
                                    endIndex: rowIndex + 1,
                                },
                            },
                        },
                    ],
                },
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting vehicle from sheet", error);
        res.status(500).json({ error: "Failed to delete vehicle" });
    }
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
