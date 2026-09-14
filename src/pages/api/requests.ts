import type { APIRoute } from "astro";
import { db } from "../../lib/firebase/server";
import { Timestamp } from "firebase-admin/firestore";

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.uid) return new Response("Unauthorized", { status: 401 });

  try {
    const data = await request.json();
    const { title, description } = data;

    if (!title || !description) return new Response("Fields required", { status: 400 });

    await db.collection("requests").add({
      title,
      description,
      createdBy: locals.uid,
      authorName: locals.displayName,
      createdAt: Timestamp.now(),
      status: 'pendiente',
      upvotes: 0
    });

    return new Response("Request created", { status: 201 });
  } catch (error) {
    return new Response("Error saving request", { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  if (!locals.uid || locals.role !== 'admin') {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    const { id, status } = await request.json();
    if (!id || !status) return new Response("Fields required", { status: 400 });

    await db.collection("requests").doc(id).update({ status });
    return new Response("Status updated", { status: 200 });
  } catch (error) {
    return new Response("Error updating status", { status: 500 });
  }
};

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.uid || locals.role !== 'admin') {
    return new Response("Unauthorized", { status: 403 });
  }
  try {
    const snapshot = await db.collection("requests").orderBy("createdAt", "desc").get();
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate().toISOString()
    }));
    return new Response(JSON.stringify(requests), { status: 200 });
  } catch (error) {
    return new Response("Error fetching requests", { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  if (!locals.uid || locals.role !== 'admin') {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    const { id } = await request.json();
    if (!id) return new Response("ID required", { status: 400 });

    await db.collection("requests").doc(id).delete();
    return new Response("Deleted", { status: 200 });
  } catch (error) {
    return new Response("Error deleting request", { status: 500 });
  }
};
