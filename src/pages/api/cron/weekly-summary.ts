import type { APIRoute } from "astro";
import { db } from "../../../lib/firebase/server";

export const GET: APIRoute = async ({ request }) => {
  // Fail closed: si CRON_SECRET no está configurado, rechazar siempre.
  const authHeader = request.headers.get('authorization');
  if (!import.meta.env.CRON_SECRET || authHeader !== `Bearer ${import.meta.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const token = import.meta.env.TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return new Response("Telegram config missing", { status: 500 });
  }

  try {
    // Calcular rango de la próxima semana (de lunes a domingo)
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
    nextMonday.setHours(0, 0, 0, 0);

    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);
    nextSunday.setHours(23, 59, 59, 999);

    const startStr = nextMonday.toISOString().split('T')[0];
    const endStr = nextSunday.toISOString().split('T')[0];

    // Consultar exámenes
    const snapshot = await db.collection("calendar_events")
      .where("type", "==", "exam")
      .where("date", ">=", startStr)
      .where("date", "<=", endStr)
      .orderBy("date", "asc")
      .get();

    const exams = snapshot.docs.map(doc => doc.data());

    if (exams.length === 0) {
      // Opcional: No enviar nada o enviar que no hay exámenes
      return new Response("No exams found for next week", { status: 200 });
    }

    // Formatear mensaje
    let message = `📚 <b>RESUMEN SEMANAL DE EXÁMENES</b> 📚\n`;
    message += `<i>Semana del ${nextMonday.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</i>\n\n`;

    exams.forEach((ex, index) => {
      const date = new Date(ex.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
      message += `${index + 1}. <b>${ex.subject}</b>\n`;
      message += `   🗓 ${date}${ex.time ? ` - ${ex.time}` : ''}\n`;
      if (ex.title) message += `   📝 ${ex.title}\n`;
      message += `   📍 Aula: ${ex.classroom || 'B1B'}\n\n`;
    });

    const PRODUCTION_DOMAIN = 'https://1bach.vercel.app';
    message += `🔗 <a href="${PRODUCTION_DOMAIN}/">Ir a la web oficial</a>`;

    // Enviar a Telegram
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();
    if (result.ok) {
      return new Response(JSON.stringify({ success: true, count: exams.length }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ error: result.description }), { status: 500 });
    }

  } catch (error) {
    console.error("Error in Weekly Summary Cron:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
