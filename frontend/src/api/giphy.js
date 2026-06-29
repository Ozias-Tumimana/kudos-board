// GIPHY search helper used by CreateCardModal.
//
// Set VITE_GIPHY_API_KEY in frontend/.env to enable gif search:
//   VITE_GIPHY_API_KEY=your_key_here
// Get a free key at https://developers.giphy.com/. If no key is configured, the
// card modal falls back to letting the user paste a gif URL directly.

const API_KEY = import.meta.env.VITE_GIPHY_API_KEY;
const ENDPOINT = 'https://api.giphy.com/v1/gifs/search';

export const hasGiphyKey = Boolean(API_KEY);

export async function searchGifs(query, { limit = 12 } = {}) {
  if (!API_KEY) {
    throw new Error('No GIPHY API key configured (set VITE_GIPHY_API_KEY).');
  }
  if (!query || !query.trim()) return [];

  const url = `${ENDPOINT}?api_key=${API_KEY}&q=${encodeURIComponent(
    query.trim()
  )}&limit=${limit}&rating=pg`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GIPHY request failed (status ${res.status}).`);
  }
  const json = await res.json();
  return (json.data || []).map((gif) => ({
    id: gif.id,
    title: gif.title,
    // fixed_height keeps the grid tidy; original used when the card is saved.
    preview: gif.images?.fixed_height?.url || gif.images?.original?.url,
    url: gif.images?.original?.url,
  }));
}
