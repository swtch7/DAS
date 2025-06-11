import { google } from 'googleapis';

const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCe91aUPU9YjQ6P
P2kpOOLMonF3KqNeNywZeXk6JGqgSIbXx1XH9KrQXGrbRYYRkhhPFACvkxdVWraU
KBax8zwUIKV/7t8R/1EzBfzkw3/sckxhhN2uJMeeAFkM3Xljkad9pI+KfQfPnkhG
nNfgBbzOr4AFsaNvLzRi5m1CQ/PUttInXdPe3xSnHshwF/JpONKHal49TIH6g5gt
6jN1Shx5WT5hdGeyu1S+YjWDTBwrzYSNniAY/50pqvKoAG5InAsM86flV6h5H4zd
ERB7FZsmBk8OTXwjhMVvr9cJzY2QvKLPgzFUeobRyEhR9C/Ssa9KGHsJkJtUYwWB
zkKDyH8zAgMBAAECggEADtBciyKjhaGvh6iQc5JPiw5gUItH/3xYvw7+PcLYWj4o
AsJwELA7nYCJ8gvVO0dIE1Ej4eNtOzu25AZQXHOfAlPV2HQ5lC3HiApjeitrJ8Jc
XSzKk8iYVEsSrAuU8l3Hzqz1NiICBlZpGdt9P+0znnc7EPdwPujr6C4yZF3SF90Z
ReN0q5+Yp4YE6Jpv86fiPedSByAp5CBZgGZ1cvhrXKz9ILWxCHobYGV8WEWO0I/T
+jJJD/ts1Gg/gwbfzGtIPAyubv52mliHRe0DxGXhhjrFxmUnL47EvXhRPUQ3rTjY
Gre+kfiOSEqpkLkt6WcfAtWHN6U83Bsi0Y0qGmEGQQKBgQDaGZzswsvAN/C8WiVI
eWeJO8qDxRNBC/Cqa5lV7PLgOVJhyGj6U+04S+qsLULDKIjs58z/I1z8y+2OCL/v
R3eyv1fY+Ppbd9QfcRalChT5HBGqsclglNJeRzmM794Oxk3aejN6Mlg1cb7LRKHY
OWPSrBFtaGwcCUUTLsCwP6yIMQKBgQC6lxkvIif/RK0JfR5frykl9FgRFR/PNqIB
pu6QEPeYXYWDvy67YmsGoRki/EE4HfS7cZPZd1Vaii6vA04gW6MS8eJZGEF0/Nwj
6JlMHLyJDUTCRN0vOoB7RKRIziw1CmdnzZ53ClynzNBDmInB7m+S0U+mqRZyqXxj
akaQlKBIowKBgQDZoX1JdAfEww1hpcJWU27RLeyjGGBiI/v+0merqkmhHRHrqQO3
509rQbXmITPhce1QGO4iGbOMPiHJ/UkpB3OV1gFe7PNFmoj85uflv+21tiCa59U+
nsJceU4gKKq4q4C8ZfxAD0Sd7+anBtFI5duKOVEaj3xxbX6T6a81MBSFwQKBgQCO
KUkazB9FMgHUVOurYz0qmbvvZ/TQX4OXVqQ0R3kdMUPkWOk2A4ofhuYr7Z2TL9+i
YKqQ6YaycM2Ysh/4L1lTuc8GqqBUjcL76N/DSbGridx1VxpePWhegrHYdpzf3Ilk
YRj3AYIOptGWbsWmaA/CAI97HyDnQ5Jt/C6/QT3NmQKBgQClkgbZfBrqduJOo85a
Mz3fr1GzAUEH+4H4A1MwUsJqzDO/g/nRlPp2fH5bZBOagWWuX+ngqvayAU1OMYiB
1hhKyhqE/2/0RZzUHUJKa16V9nnMIzIx+zmUetvq1+vGtPE98Samb09FAwWv5i9f
mb+3CVPVBm7gCrVbu5osjefiZg==
-----END PRIVATE KEY-----`;

async function verifySheets() {
  try {
    const credentials = {
      type: 'service_account',
      project_id: 'n8ntest-461313',
      private_key: privateKey,
      client_email: 'hc-sheets-service@n8ntest-461313.iam.gserviceaccount.com',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
    };

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1O7AJcTCfXrV63hy2yXwOjdx2I730bf4xB21Z88M9vv4';

    console.log('Testing Google Sheets access...');
    
    // First check if we can access the spreadsheet
    const sheetsInfo = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    
    console.log('✅ Spreadsheet access successful');
    console.log('Available sheets:');
    sheetsInfo.data.sheets.forEach(sheet => {
      console.log(`- ${sheet.properties.title}`);
    });
    
    // Look for CashApp sheet or use first available
    const cashAppSheet = sheetsInfo.data.sheets.find(s => s.properties.title.toLowerCase().includes('cash'));
    const targetSheet = cashAppSheet ? cashAppSheet.properties.title : sheetsInfo.data.sheets[0].properties.title;
    
    console.log(`\nTesting write to "${targetSheet}" sheet...`);
    
    const writeResult = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${targetSheet}!A:J`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['VERIFY', 'Test Credit Purchase', 'User', 'test@example.com', '555-0123', 'Test Location', '100', '10.00', '', new Date().toISOString()]],
      },
    });

    console.log('✅ Google Sheets write successful!');
    console.log('Data written to:', writeResult.data.updates.updatedRange);

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    if (error.code === 403) {
      console.error('❌ Permission denied - service account needs access to the sheet');
    } else if (error.code === 404) {
      console.error('❌ Sheet not found - check the spreadsheet ID');
    }
  }
}

verifySheets();