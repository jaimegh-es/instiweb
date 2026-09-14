import type { APIRoute } from "astro";
import { db } from "../../lib/firebase/server";

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.uid) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const doc = await db.collection("config").doc("dashboard").get();
    if (!doc.exists) {
        return new Response(JSON.stringify({ showRequests: false, blockNonAdmins: false }), { status: 200 });
    }
    return new Response(JSON.stringify(doc.data()), { status: 200 });
  } catch (error) {
    return new Response("Error fetching settings", { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.uid || locals.role !== 'admin') {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    const data = await request.json();
    await db.collection("config").doc("dashboard").set(data, { merge: true });
    return new Response("Settings updated", { status: 200 });
  } catch (error) {
    return new Response("Error updating settings", { status: 500 });
  }
};
