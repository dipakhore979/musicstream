// Tiny promise wrapper around IndexedDB. Two stores:
//   meta  - one small record per downloaded song (who saved it, the song's details, size, date)
//   audio - the audio file itself, kept apart so listing downloads never loads the big files
// Records are keyed "<userId>:<songId>", so accounts sharing a browser don't see each other's downloads.
const DB_NAME = "musicstream-offline";
let dbPromise;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) return reject(new Error("IndexedDB is not available"));
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("meta", { keyPath: "key" });
        request.result.createObjectStore("audio");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    dbPromise.catch(() => {
      dbPromise = undefined; // allow a later retry
    });
  }
  return dbPromise;
}

const asPromise = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const finished = (tx) =>
  new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error); // e.g. QuotaExceededError when the device is full
  });

// Writes the record and the file in ONE transaction, so you never end up with one without the other.
export async function putSong(meta, blob) {
  const db = await openDb();
  const tx = db.transaction(["meta", "audio"], "readwrite");
  tx.objectStore("meta").put(meta);
  tx.objectStore("audio").put(blob, meta.key);
  await finished(tx);
}

export async function deleteSongs(keys) {
  const db = await openDb();
  const tx = db.transaction(["meta", "audio"], "readwrite");
  for (const key of keys) {
    tx.objectStore("meta").delete(key);
    tx.objectStore("audio").delete(key);
  }
  await finished(tx);
}

export async function getAllMeta() {
  const db = await openDb();
  return asPromise(db.transaction("meta").objectStore("meta").getAll());
}

export async function getBlob(key) {
  const db = await openDb();
  return asPromise(db.transaction("audio").objectStore("audio").get(key));
}
