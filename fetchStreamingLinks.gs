/**
 * Looks up Apple Music and Spotify links for each row using Artist (col D) and Title (col C).
 * Writes Apple link to col M and Spotify link to col N.
 *
 * Requirements:
 *  - Apple: none (uses iTunes Search API)
 *  - Spotify: set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in Script Properties
 */
function fetchStreamingLinks() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // ← adjust if your layout moves
  const COL_TITLE   = 3;  // C
  const COL_ARTIST  = 4;  // D
  const COL_APPLE   = 13; // M
  const COL_SPOTIFY = 14; // N

  const startRow = 2;
  const lastRow  = sheet.getLastRow();
  if (lastRow < startRow) return;

  const titles  = sheet.getRange(startRow, COL_TITLE,  lastRow - startRow + 1, 1).getValues();
  const artists = sheet.getRange(startRow, COL_ARTIST, lastRow - startRow + 1, 1).getValues();

  // --- Spotify auth (Client Credentials flow) ---
  const SPOTIFY_CLIENT_ID     = PropertiesService.getScriptProperties().getProperty('SPOTIFY_CLIENT_ID');
  const SPOTIFY_CLIENT_SECRET = PropertiesService.getScriptProperties().getProperty('SPOTIFY_CLIENT_SECRET');
  let spotifyToken = null;

  if (SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET) {
    const tokenResp = UrlFetchApp.fetch('https://accounts.spotify.com/api/token', {
      method: 'post',
      payload: { grant_type: 'client_credentials' },
      headers: {
        Authorization: 'Basic ' + Utilities.base64Encode(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)
      },
      muteHttpExceptions: true
    });
    if (tokenResp.getResponseCode() === 200) {
      spotifyToken = JSON.parse(tokenResp.getContentText()).access_token;
    } else {
      Logger.log('Spotify token error: ' + tokenResp.getContentText());
    }
  } else {
    Logger.log('Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET (Script Properties). Spotify lookup will be skipped.');
  }

  for (let i = 0; i < titles.length; i++) {
    const rowIndex = startRow + i;
    const title  = (titles[i][0]  ?? '').toString().trim();
    const artist = (artists[i][0] ?? '').toString().trim();
    if (!title && !artist) continue;

    // --- Apple Music via iTunes Search API (no auth) ---
    // Try album match first; fallback to track
    const country = 'US'; // change if you want a different store
    const term = encodeURIComponent([artist, title].filter(Boolean).join(' '));
    let appleUrl = '';

    try {
      // Prefer album entity to get collection link; fallback to song
      const appleAlbumURL = `https://itunes.apple.com/search?term=${term}&entity=album&limit=1&country=${country}`;
      let resp = UrlFetchApp.fetch(appleAlbumURL, { muteHttpExceptions: true });
      if (resp.getResponseCode() === 200) {
        const data = JSON.parse(resp.getContentText());
        if (data.results && data.results.length) {
          appleUrl = data.results[0].collectionViewUrl || data.results[0].artistViewUrl || '';
        }
      }
      if (!appleUrl) {
        const appleTrackURL = `https://itunes.apple.com/search?term=${term}&entity=song&limit=1&country=${country}`;
        resp = UrlFetchApp.fetch(appleTrackURL, { muteHttpExceptions: true });
        if (resp.getResponseCode() === 200) {
          const data = JSON.parse(resp.getContentText());
          if (data.results && data.results.length) {
            appleUrl = data.results[0].trackViewUrl || data.results[0].collectionViewUrl || '';
          }
        }
      }
    } catch (e) {
      Logger.log('Apple lookup error row ' + rowIndex + ': ' + e);
    }

    // --- Spotify Search (requires token) ---
    let spotifyUrl = '';
    if (spotifyToken) {
      try {
        // Bias search to artist + track first; then fallback to album
        const qTrack = 'artist:"' + artist.replace(/"/g, '\\"') + '" track:"' + title.replace(/"/g, '\\"') + '"';
        let spResp = UrlFetchApp.fetch('https://api.spotify.com/v1/search?q=' + encodeURIComponent(qTrack) + '&type=track&limit=1', {
          headers: { Authorization: 'Bearer ' + spotifyToken },
          muteHttpExceptions: true
        });
        if (spResp.getResponseCode() === 200) {
          const r = JSON.parse(spResp.getContentText());
          const item = r.tracks?.items?.[0];
          if (item?.external_urls?.spotify) spotifyUrl = item.external_urls.spotify;
        }

        if (!spotifyUrl) {
          const qAlbum = 'artist:"' + artist.replace(/"/g, '\\"') + '" album:"' + title.replace(/"/g, '\\"') + '"';
          spResp = UrlFetchApp.fetch('https://api.spotify.com/v1/search?q=' + encodeURIComponent(qAlbum) + '&type=album&limit=1', {
            headers: { Authorization: 'Bearer ' + spotifyToken },
            muteHttpExceptions: true
          });
          if (spResp.getResponseCode() === 200) {
            const r = JSON.parse(spResp.getContentText());
            const item = r.albums?.items?.[0];
            if (item?.external_urls?.spotify) spotifyUrl = item.external_urls.spotify;
          }
        }
      } catch (e) {
        Logger.log('Spotify lookup error row ' + rowIndex + ': ' + e);
      }
    }

    // Write results
    if (appleUrl)   sheet.getRange(rowIndex, COL_APPLE).setFormula(`=HYPERLINK("${appleUrl}", "Apple Music")`);
    if (spotifyUrl) sheet.getRange(rowIndex, COL_SPOTIFY).setFormula(`=HYPERLINK("${spotifyUrl}", "Spotify")`);

    Utilities.sleep(250); // be polite; raise if you hit rate limits
  }
}
