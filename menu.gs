/**
 * Adds a custom menu to the Google Sheet so you can run your scripts
 * without opening the Apps Script editor.
 *
 * Menu: Discogs & Music
 *  - Fetch Discogs Data
 *  - Fetch Streaming Links
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Discogs & Music')
    .addItem('Fetch Discogs Data', 'fetchDiscogsWithArt')
    .addItem('Fetch Streaming Links', 'fetchStreamingLinks')
    .addToUi();
}
