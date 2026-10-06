import type { APIRoute } from "astro";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.uid || locals.role !== 'admin') {
    return new Response("Unauthorized", { status: 403 });
  }

  const token = import.meta.env.TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return new Response(JSON.stringify({ error: "Telegram config missing" }), { status: 500 });
  }

  try {
    const { title, subtitle, image, link, type } = await request.json();

    const PRODUCTION_DOMAIN = 'https://2bach.vercel.app';
    
    // Función para escapar HTML básico de Telegram
    const escapeHTML = (text: string) => text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const safeTitle = escapeHTML(title || "");
    const safeSubtitle = escapeHTML(subtitle || "");

    let text = `<b>${safeTitle}</b>\n\n`;
    if (safeSubtitle) text += `${safeSubtitle}\n\n`;
    
    // Procesar el enlace: si existe, asegurar que usa el dominio de producción
    let finalLink = link || '/';
    if (finalLink.startsWith('http')) {
        finalLink = finalLink.replace(/https?:\/\/[^\/]+/, PRODUCTION_DOMAIN);
    } else {
        finalLink = `${PRODUCTION_DOMAIN}${finalLink.startsWith('/') ? finalLink : '/' + finalLink}`;
    }

    text += `<a href="${finalLink}">${link && link.includes('/noticias/') ? 'Leer noticia completa' : 'Ir a la web oficial'}</a>`;

    const baseUrl = `https://api.telegram.org/bot${token}`;
    const isSvg = image?.toLowerCase().endsWith('.svg');

    // Preparar el envío
    if (image && !image.startsWith('http') && !isSvg) {
        try {
            // SEGURIDAD: Sanitizar la ruta de la imagen para evitar Path Traversal
            // Solo permitimos el nombre del archivo, eliminando cualquier intento de subir directorios
            const fileName = image.split('/').pop() || "";
            const filePath = join(process.cwd(), 'public', fileName);
            
            // Verificamos que el archivo existe y es una ruta segura
            const fileBuffer = await readFile(filePath);
            const fileBlob = new Blob([fileBuffer]);
            
            const formData = new FormData();
            formData.append('chat_id', chatId);
            formData.append('photo', fileBlob, fileName);
            formData.append('caption', text);
            formData.append('parse_mode', 'HTML');

            const response = await fetch(`${baseUrl}/sendPhoto`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.ok) return new Response(JSON.stringify({ success: true }), { status: 200 });
            
            console.error("Telegram Upload Error:", result);
        } catch (e) {
            console.error("Error reading file for Telegram (Security Check failed or File missing):", e);
        }
    }

    // Fallback: Enviar como mensaje de texto (si no hay imagen, si es SVG, o si falló el upload)
    let finalText = text;
    if (image) {
        const fullImageUrl = image.startsWith('http') ? image : `${PRODUCTION_DOMAIN}/${image.startsWith('/') ? image.slice(1) : image}`;
        finalText = `${isSvg ? '🖼' : '📸'} <b>Imagen:</b> ${fullImageUrl}\n\n${text}`;
    }

    const response = await fetch(`${baseUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: finalText,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      })
    });

    const result = await response.json();

    if (result.ok) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      console.error("Telegram API Error:", result);
      return new Response(JSON.stringify({ error: result.description }), { status: 500 });
    }
  } catch (error) {
    console.error("Error in Telegram API:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
};
