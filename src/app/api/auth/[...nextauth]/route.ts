export async function GET() {
  return Response.json(
    { error: "NextAuth has been replaced by Supabase Auth in this app." },
    { status: 410 },
  );
}

export const POST = GET;
