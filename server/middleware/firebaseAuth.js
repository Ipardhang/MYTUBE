import jwt from "jsonwebtoken";

let certificateCache = { keys: null, expiresAt: 0 };

const loadCertificates = async () => {
  const now = Date.now();
  if (certificateCache.keys && certificateCache.expiresAt > now) return certificateCache.keys;
  const response = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
  if (!response.ok) throw new Error("Firebase certificate request failed");
  const keys = await response.json();
  const cacheControl = response.headers.get("cache-control") || "";
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/i)?.[1] || 300);
  certificateCache = { keys, expiresAt: now + maxAge * 1000 };
  return keys;
};

export const verifyFirebaseToken = async (req, res, next) => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!projectId || !token) return res.status(401).json({ message: "Sign in is required." });

  try {
    const decoded = jwt.decode(token, { complete: true });
    const keyId = decoded?.header?.kid;
    const certificates = await loadCertificates();
    const certificate = certificates[keyId];
    if (!certificate) return res.status(401).json({ message: "Invalid sign-in token." });

    const payload = jwt.verify(token, certificate, {
      algorithms: ["RS256"],
      audience: projectId,
      issuer: "https://securetoken.google.com/" + projectId,
    });
    if (typeof payload === "string" || !payload.email) {
      return res.status(401).json({ message: "The account token is incomplete." });
    }
    req.auth = { uid: payload.sub, email: payload.email, emailVerified: Boolean(payload.email_verified) };
    return next();
  } catch (error) {
    console.warn("Firebase token verification failed:", error.message);
    return res.status(401).json({ message: "Sign in again to continue." });
  }
};
