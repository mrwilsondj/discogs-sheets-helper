# Discogs → Google Sheets (Release Links, Have/Want, Lowest Price, Cover Art)

Google Apps Script function that, for each **Release ID** in column **A**:
- Writes a **Discogs link** in column **I**
- Writes **community have** & **want** in columns **J** and **K**
- Writes **current lowest listing price (USD)** in column **L**
- Inserts **cover art** in column **Q** via `=IMAGE()`

## Setup

1. **Paste the code** into your Google Sheet:
   - In your Sheet: `Extensions → Apps Script`
   - Create a file (e.g., `discogs.gs`) and paste the script.

2. **Add your Discogs API token** (do not hardcode tokens in code):
   - Apps Script editor → **Project Settings** (gear icon)
   - Under **Script properties**, add:
     - Key: `DISCOGS_TOKEN`
     - Value: `<your-discogs-personal-token>`

3. **Column layout (adjust in code if your sheet differs)**
   - A: `release_id` (numeric)
   - C: Title
   - D: Artist
   - I: Discogs Link (formula written by script)
   - J: Community Have
   - K: Community Want
   - L: Lowest Price (USD)
   - Q: Cover Art (`=IMAGE(...)`)

## Usage

Open your Sheet and run:
- `Extensions → Apps Script → Run → fetchDiscogsWithArt`
- Grant permissions on first run when prompted.

## Streaming Links

The helper function `fetchStreamingLinks()` looks up Apple Music and Spotify URLs
for each row using **Artist (col D)** and **Title (col C)**.  
- Writes **Apple Music** link to column M  
- Writes **Spotify** link to column N  

### Setup
- Apple Music: no setup (uses iTunes Search API)
- Spotify: add `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` under  
  **Extensions → Apps Script → Project Settings → Script properties**

### Usage
Run `fetchStreamingLinks()` from the Apps Script editor.  
Hyperlinked Apple Music and Spotify results will appear in columns M & N.
## Notes

- **Rate limits:** Script sleeps 500ms per row to be polite. Tweak as needed.
- **Cover art:** Uses the first image from the release’s `images[]` (usually the front cover).
- **Currencies:** Stats endpoint is queried with `curr_abbr=USD`.
- **User-Agent:** Customize the `USER_AGENT` string to reflect your app/site.

## Security

- The script reads `DISCOGS_TOKEN` from **Script Properties** so secrets never live in source control.
- Do **not** commit tokens, keys, or private data to the repo.

## Troubleshooting

- `Exception: Request failed for https://api.discogs.com ...`: Check token value and rate limits.
- No images inserted: Some releases may lack images; verify the release ID is valid.
- Wrong columns: Update the `COL_*` constants in the script to match your sheet.

## License

MIT (optional—choose what you prefer).
