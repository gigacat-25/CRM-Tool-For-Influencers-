import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "scene_co_influencer_crm_jwt_super_secret_key_987654321"
);

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "manager" | "viewer";
}

// Signs a JWT session token
export async function signSessionJWT(payload: UserSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

// Verifies a JWT session token
export async function verifySessionJWT(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserSession;
  } catch (error) {
    return null;
  }
}

// Edge-compatible password hashing using Web Crypto API SHA-256
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Compares password with stored SHA-256 hash
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const incomingHash = await hashPassword(password);
  return incomingHash === hash;
}

// Permissions definitions based on roles
export const ROLE_PERMISSIONS = {
  super_admin: {
    canEditInfluencers: true,
    canDeleteInfluencers: true,
    canViewPayments: true,
    canEditPayments: true,
    canCreateCampaigns: true,
    canDeleteCampaigns: true,
    canEditBrands: true
  },
  admin: {
    canEditInfluencers: true,
    canDeleteInfluencers: false,
    canViewPayments: true,
    canEditPayments: true,
    canCreateCampaigns: true,
    canDeleteCampaigns: false,
    canEditBrands: true
  },
  manager: {
    canEditInfluencers: true,
    canDeleteInfluencers: false,
    canViewPayments: false, // Managers cannot see financial layouts
    canEditPayments: false,
    canCreateCampaigns: true,
    canDeleteCampaigns: false,
    canEditBrands: true
  },
  viewer: {
    canEditInfluencers: false,
    canDeleteInfluencers: false,
    canViewPayments: false,
    canEditPayments: false,
    canCreateCampaigns: false,
    canDeleteCampaigns: false,
    canEditBrands: false
  }
};
