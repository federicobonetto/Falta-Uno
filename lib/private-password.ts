const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string) {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return new Uint8Array();
  return new Uint8Array(hex.match(/.{2}/g)?.map((value) => Number.parseInt(value, 16)) ?? []);
}

async function derive(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: salt as BufferSource, iterations: 100_000, hash: "SHA-256" }, key, 256);
  return new Uint8Array(bits);
}

export async function hashPrivatePassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: bytesToHex(salt), hash: bytesToHex(await derive(password, salt)) };
}

export async function verifyPrivatePassword(password: string, saltHex: string | null, hashHex: string | null) {
  if (!saltHex || !hashHex) return false;
  const expected = hexToBytes(hashHex);
  const actual = await derive(password, hexToBytes(saltHex));
  if (expected.length !== actual.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= expected[index] ^ actual[index];
  return difference === 0;
}

export async function createStoredPassword(password: string) {
  const result = await hashPrivatePassword(password);
  return `${result.salt}:${result.hash}`;
}

export async function verifyStoredPassword(password: string, stored: string | null) {
  const [salt, hash] = stored?.split(":") ?? [];
  return verifyPrivatePassword(password, salt ?? null, hash ?? null);
}
