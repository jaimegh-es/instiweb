import type { APIRoute } from "astro";
import { db } from "../../lib/firebase/server";
import { Timestamp } from "firebase-admin/firestore";

export const GET: APIRoute = async () => {
  try {
    const snapshot = await db.collection("news").orderBy("date", "desc").get();
    const news = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return new Response(JSON.stringify(news), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Error fetching news" }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.uid || locals.role !== 'admin') {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    const data = await request.json();
    const { title, description, image, content, date } = data;

    if (!isValidNewsInput(title, date, description, content, image)) {
      return new Response("Invalid data", { status: 400 });
    }

    const docRef = await db.collection("news").add({
      title,
      description: description || "",
      image: image || "favicon.svg",
      content: content || "",
      date,
      createdAt: Timestamp.now(),
      createdBy: locals.uid
    });

    return new Response(JSON.stringify({ success: true, id: docRef.id }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Error creating news" }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  if (!locals.uid || locals.role !== 'admin') {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    const data = await request.json();
    const { id, title, description, image, content, date } = data;

    if (typeof id !== 'string' || id.length > 128 || !isValidNewsInput(title, date, description, content, image)) {
        return new Response("Invalid data", { status: 400 });
    }

    await db.collection("news").doc(id).update({
      title,
      description: description || "",
      image: image || "favicon.svg",
      content: content || "",
      date,
      updatedAt: Timestamp.now(),
      updatedBy: locals.uid
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Error updating news" }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  if (!locals.uid || locals.role !== 'admin') {
    return new Response("Unauthorized", { status: 403 });
  }

  try {
    const { id } = await request.json();
    if (typeof id !== 'string' || id.length === 0 || id.length > 128) return new Response("ID required", { status: 400 });

    await db.collection("news").doc(id).delete();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Error deleting news" }), { status: 500 });
  }
};

function isValidNewsInput(
  title: unknown,
  date: unknown,
  description: unknown,
  content: unknown,
  image: unknown
): boolean {
  const isShortString = (v: unknown, max: number) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

  if (!isShortString(title, 200)) return false;

  const dateStr = typeof date === 'string' ? date : '';
  if (!dateStr || isNaN(new Date(dateStr).getTime()) || dateStr.length > 40) return false;

  if (description !== undefined && (typeof description !== 'string' || description.length > 500)) return false;
  if (content !== undefined && (typeof content !== 'string' || content.length > 50000)) return false;

  if (image !== undefined && image !== null) {
    if (typeof image !== 'string' || image.length > 300) return false;
    // Bloquear rutas absolutas y path traversal
    if (image.includes('..') || image.startsWith('/') || image.startsWith('javascript:')) return false;
  }

  return true;
}
