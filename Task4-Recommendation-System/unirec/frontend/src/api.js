const BASE = "/api";

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const contentType = res.headers.get("content-type");
  let data;
  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    throw new Error(`Server returned non-JSON response (${res.status}). Backend may be offline or starting up.`);
  }

  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  register:   (d) => req("POST", "/register", d),
  login:      (d) => req("POST", "/login", d),
  logout:     ()  => req("POST", "/logout"),
  me:         ()  => req("GET",  "/me"),
  recommend:  (d) => req("POST", "/recommend", d),
  trending:   (cat) => req("GET", `/trending?category=${cat}`),
  search:     (d) => req("POST", "/search", d),
  rate:       (d) => req("POST", "/rate", d),
  save:       (d) => req("POST", "/save", d),
  getSaved:   ()  => req("GET",  "/saved"),
  getRatings: ()  => req("GET",  "/ratings"),
  getDNA:     ()  => req("GET",  "/dna"),
  categories: ()  => req("GET",  "/categories"),
};
