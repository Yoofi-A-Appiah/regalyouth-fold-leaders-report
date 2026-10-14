// Plain sync helper -- see period.ts for why this can't live in db.ts's "use server" module.
export function isMongoConfigured(): boolean {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) return false;
  // If user still has placeholder <db_username> or <db_password>
  if (uri.includes('<db_username>') || uri.includes('<db_password>')) return false;
  return true;
}
