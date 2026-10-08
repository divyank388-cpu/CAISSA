// Talks to the FastAPI backend (python-chess is the authority on the rules).
export class BackendOfflineError extends Error {}
export class BackendRejectedError extends Error {}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api/games${path}`, { headers: { "Content-Type": "application/json" }, ...options });
  } catch {
    throw new BackendOfflineError("Server not reachable");
  }
  const data = await response.json().catch(() => undefined);
  if (data === undefined) throw new BackendOfflineError("Server returned an unexpected response");
  if (!response.ok) throw new BackendRejectedError(data.detail ?? `Server error ${response.status}`);
  return data;
}

export const createGame = () => request("", { method: "POST" });
export const getGame = (id) => request(`/${id}`);
export const playMove = (id, uci) => request(`/${id}/moves`, { method: "POST", body: JSON.stringify({ uci }) });
export const undoMove = (id) => request(`/${id}/undo`, { method: "POST" });
