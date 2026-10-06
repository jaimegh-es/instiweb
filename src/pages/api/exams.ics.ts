import type { APIRoute } from "astro";
import { db } from "../../lib/firebase/server";

export const GET: APIRoute = async ({ request }) => {
  try {
    // 1. Obtener metadatos de última actualización
    const metaDoc = await db.collection("app_meta").doc("exams").get();
    const lastUpdated = (metaDoc.exists && metaDoc.data()?.lastUpdated) 
      ? metaDoc.data().lastUpdated.toDate() 
      : new Date();
    
    // 2. Formatear fecha para ICS (UTC)
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const stamp = formatICSDate(lastUpdated);

    // Funciones auxiliares para cumplimiento de RFC 5545
    const escapeText = (text: string) => {
      if (!text) return "";
      return text
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\n/g, "\\n");
    };

    const foldLine = (line: string) => {
      const parts = [];
      let current = line;
      // El estándar dice 75 octetos. Usamos un margen de seguridad.
      while (Buffer.byteLength(current, 'utf8') > 72) {
        let splitPos = 70;
        // Evitar romper secuencias de escape o caracteres multi-byte de forma bruta
        let slice = current.substring(0, splitPos);
        while (Buffer.byteLength(slice, 'utf8') > 72 && splitPos > 1) {
          splitPos--;
          slice = current.substring(0, splitPos);
        }
        parts.push(slice);
        current = " " + current.substring(splitPos);
      }
      parts.push(current);
      return parts.join("\r\n");
    };

    // 3. Obtener exámenes
    const snapshot = await db.collection("calendar_events").where("type", "==", "exam").get();
    
    // 4. Construir contenido ICS
    let icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//1B Bach//Examenes//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${escapeText("Exámenes 1B Bach")}`,
      "X-WR-TIMEZONE:Europe/Madrid",
      `X-WR-CALDESC:${escapeText("Calendario de exámenes de 1º Bachillerato B")}`,
      "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
      "X-PUBLISHED-TTL:PT1H"
    ];

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const id = doc.id;
      
      // Asegurar que tenemos una fecha válida (formato YYYY-MM-DD esperado en data.date)
      if (!data.date) return;
      
      const rawTime = data.time || "08:30";
      const [hh, mm] = rawTime.split(":").map(s => s.padStart(2, '0'));
      
      // Crear objeto fecha interpretando como hora local de Madrid
      // Usamos un string ISO-like para que el constructor de Date lo trate correctamente
      const startDate = new Date(`${data.date}T${hh || "08"}:${mm || "00"}:00`);
      
      if (isNaN(startDate.getTime())) return;

      // Calcular fin (1 hora después)
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      // Convertir a formato ICS UTC (YYYYMMDDTHHMMSSZ)
      const toICSUTC = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      
      const startStr = toICSUTC(startDate);
      const endStr = toICSUTC(endDate);

      const summary = escapeText(data.title || data.subject || "Examen");
      const description = [
        data.subject ? `Asignatura: ${data.subject}` : "",
        data.details ? `Detalles: ${data.details.replace(/<[^>]*>?/gm, '')}` : "", 
        `Aula: ${data.classroom || "B1B"}`
      ].filter(Boolean).map(line => escapeText(line)).join("\\n");

      icsLines.push("BEGIN:VEVENT");
      icsLines.push(`UID:${id}@2bach.vercel.app`);
      icsLines.push(`DTSTAMP:${stamp}`);
      icsLines.push(`DTSTART:${startStr}`); 
      icsLines.push(`DTEND:${endStr}`);
      icsLines.push(`SUMMARY:${summary}`);
      icsLines.push(`DESCRIPTION:${description}`);
      icsLines.push(`LOCATION:${escapeText(data.classroom || "B1B")}`);
      icsLines.push(`LAST-MODIFIED:${stamp}`);
      icsLines.push("END:VEVENT");
    });

    icsLines.push("END:VCALENDAR");

    // Aplicar plegado de líneas y unir con CRLF
    const icsContent = icsLines.map(foldLine).join("\r\n") + "\r\n";

    return new Response(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        // Eliminamos Content-Disposition para evitar problemas con Google Calendar
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=3600",
        "Access-Control-Allow-Origin": "*",
        "Last-Modified": lastUpdated.toUTCString(),
      }
    });
  } catch (error) {
    console.error("Error generating ICS:", error);
    return new Response("Error", { status: 500 });
  }
};

