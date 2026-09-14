import { defineMiddleware } from 'astro:middleware';
import { auth, db } from './lib/firebase/server';
import { ADMIN_EMAIL } from './lib/constants';

export const onRequest = defineMiddleware(async (context, next) => {
    const url = new URL(context.request.url);
    const pathname = url.pathname;

    // Rutas protegidas
    if (pathname.startsWith('/dashboard') || 
        pathname.startsWith('/api/absences') || 
        pathname.startsWith('/api/users') ||
        pathname.startsWith('/api/complaints') ||
        pathname.startsWith('/api/requests') ||
        pathname.startsWith('/api/settings') ||
        pathname.startsWith('/api/calendar') ||
        pathname.startsWith('/api/news') ||
        pathname.startsWith('/api/telegram') ||
        pathname.startsWith('/api/files') ||
        pathname.startsWith('/api/subjects')) {
        const sessionCookie = context.cookies.get('session')?.value;

        if (!sessionCookie) {
            return context.redirect('/login');
        }

        try {
            const decodedCookie = await auth.verifySessionCookie(sessionCookie);
            context.locals.uid = decodedCookie.uid;
            context.locals.email = decodedCookie.email;

            // Fetch user record for display name
            const userRecord = await auth.getUser(decodedCookie.uid);
            context.locals.displayName = userRecord.displayName || "Usuario";

            // Fetch role from DB to be sure
            const userDoc = await db.collection("users").doc(decodedCookie.uid).get();
            const userData = userDoc.data();
            
            if (userData?.banned) {
                return context.redirect('/maintenance');
            }

            // Force admin role if email matches constant
            if (context.locals.email === ADMIN_EMAIL) {
                context.locals.role = 'admin';
            } else {
                context.locals.role = userData?.role || 'user';
            }

            // Check for Maintenance Mode
            const configDoc = await db.collection("config").doc("dashboard").get();
            const config = configDoc.data();
            
            if (config?.blockNonAdmins && context.locals.role !== 'admin') {
                return context.redirect('/maintenance');
            }

        } catch (error) {
            return context.redirect('/login');
        }
    }

    const response = await next();

    // Security Headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://apis.google.com https://www.gstatic.com https://vercel.live https://cdn.jsdelivr.net https://cdn-cookieyes.com https://www.clarity.ms; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://cdn-cookieyes.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https://*.googleusercontent.com https://vercel.com https://*.cookieyes.com https://cdn-cookieyes.com https://*.clarity.ms; connect-src 'self' https://api.github.com https://*.googleapis.com https://*.firebaseapp.com https://cdnjs.cloudflare.com https://fonts.gstatic.com https://vercel.live https://*.vercel.app https://cdn.jsdelivr.net https://apis.google.com https://www.gstatic.com https://*.google.com https://*.cookieyes.com https://cdn-cookieyes.com https://*.clarity.ms; frame-src 'self' https://*.firebaseapp.com https://vercel.live;");

    // Verificar si es una imagen
    const isImage = /\.(jpg|jpeg|png|gif|svg|webp|avif|ico)$/i.test(pathname);

    if (isImage) {
        // Para imágenes: caché largo
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (!pathname.startsWith('/dashboard') && !pathname.startsWith('/api/')) {
        // Para otras rutas públicas (no dashboard/api)
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
    }

    return response;
});
