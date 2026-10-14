// Plain sync helper -- must NOT live in a "use server" file (like db.ts). A "use server"
// export becomes a Server Action: every call turns into a network round-trip that returns
// a Promise, and every call site in this app was reading that Promise as a string without
// awaiting it (e.g. `submission.period` got set to a Promise object, which then serializes
// to `undefined` over JSON and silently drops the period on every new report).
export function currentPeriodKey(): string {
  const now = new Date();
  const half = now.getDate() <= 15 ? 'A' : 'B';
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${half}`;
}
