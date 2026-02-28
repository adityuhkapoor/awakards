const BASE = '/api';

export async function generateImage(imageBase64) {
  const res = await fetch(`${BASE}/generate-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64 }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return (await res.json()).imageBase64;
}

export async function parseStats(description) {
  const res = await fetch(`${BASE}/parse-stats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return (await res.json()).stats;
}
