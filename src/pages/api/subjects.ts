import type { APIRoute } from "astro";
import { db } from "../../lib/firebase/server";

const DEFAULT_SUBJECTS = [
  "Lengua",
  "Gallego",
  "Inglés",
  "Matemáticas",
  "Física y Química",
  "Biología",
  "Historia",
  "Filosofía",
  "Educación Física",
  "Religión/Valores",
  "TIC",
  "Economía",
  "Cultura Clásica",
  "Dibujo Técnico",
  "Latín",
  "Griego",
  "Francés",
];

// GET: lista de asignaturas (público, solo lectura)
export const GET: APIRoute = async () => {
  try {
    const doc = await db.collection("config").doc("subjects").get();
    const data = doc.data();
    const list = data?.list?.length ? data.list : DEFAULT_SUBJECTS;
    return new Response(JSON.stringify({ subjects: list }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ subjects: DEFAULT_SUBJECTS }), { status: 200 });
  }
};

// POST: añadir asignatura (solo admins)
export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.uid || locals.role !== "admin") {
    return new Response("Unauthorized", { status: 403 });
  }
  try {
    const { subject } = await request.json();
    const name = (subject || "").trim();
    if (!name) return new Response("Bad request", { status: 400 });

    const ref = db.collection("config").doc("subjects");
    const doc = await ref.get();
    let list: string[] = doc.data()?.list?.length ? doc.data().list : DEFAULT_SUBJECTS;

    if (!list.some((s: string) => s.toLowerCase() === name.toLowerCase())) {
      list = [...list, name];
    }
    await ref.set({ list }, { merge: true });
    return new Response(JSON.stringify({ subjects: list }), { status: 200 });
  } catch (error) {
    return new Response("Error adding subject", { status: 500 });
  }
};

// DELETE: eliminar asignatura (solo admins)
export const DELETE: APIRoute = async ({ request, locals }) => {
  if (!locals.uid || locals.role !== "admin") {
    return new Response("Unauthorized", { status: 403 });
  }
  try {
    const { subject } = await request.json();
    const name = (subject || "").trim();
    if (!name) return new Response("Bad request", { status: 400 });

    const ref = db.collection("config").doc("subjects");
    const doc = await ref.get();
    const list: string[] = doc.data()?.list || [];

    const newList = list.filter((s) => s !== name);
    await ref.set({ list: newList }, { merge: true });
    return new Response(JSON.stringify({ subjects: newList }), { status: 200 });
  } catch (error) {
    return new Response("Error deleting subject", { status: 500 });
  }
};
