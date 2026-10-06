
const PRODUCTION_DOMAIN = 'https://2bach.vercel.app';

function transformLink(link) {
    let finalLink = link || '/';
    if (finalLink.startsWith('http')) {
        finalLink = finalLink.replace(/https?:\/\/[^\/]+/, PRODUCTION_DOMAIN);
    } else {
        finalLink = `${PRODUCTION_DOMAIN}${finalLink.startsWith('/') ? finalLink : '/' + finalLink}`;
    }
    
    const buttonText = link && link.includes('/noticias/') ? 'Leer noticia completa' : 'Ir a la web oficial';
    return { finalLink, buttonText };
}

// Casos de prueba
const tests = [
    {
        name: "Noticia con path relativo",
        input: "/noticias/12345",
        expectedLink: "https://2bach.vercel.app/noticias/12345",
        expectedButton: "Leer noticia completa"
    },
    {
        name: "Examen sin link (undefined)",
        input: undefined,
        expectedLink: "https://2bach.vercel.app/",
        expectedButton: "Ir a la web oficial"
    },
    {
        name: "Link de localhost (Vercel local)",
        input: "http://localhost:4321/dashboard",
        expectedLink: "https://2bach.vercel.app/dashboard",
        expectedButton: "Ir a la web oficial"
    },
    {
        name: "Link de despliegue de Vercel (peligroso)",
        input: "https://1bach-git-main-jaime.vercel.app/dashboard",
        expectedLink: "https://2bach.vercel.app/dashboard",
        expectedButton: "Ir a la web oficial"
    }
];

console.log("🚀 Iniciando validación de lógica de enlaces...");
let failures = 0;

tests.forEach(t => {
    const result = transformLink(t.input);
    const linkOk = result.finalLink === t.expectedLink;
    const buttonOk = result.buttonText === t.expectedButton;

    if (linkOk && buttonOk) {
        console.log(`✅ PASSED: ${t.name}`);
    } else {
        failures++;
        console.log(`❌ FAILED: ${t.name}`);
        console.log(`   Input: ${t.input}`);
        console.log(`   Expected: ${t.expectedLink} | ${t.expectedButton}`);
        console.log(`   Got:      ${result.finalLink} | ${result.buttonText}`);
    }
});

if (failures === 0) {
    console.log("\n✨ ¡Todos los tests han pasado! La lógica de enlaces es segura.");
    process.exit(0);
} else {
    console.log(`\n⚠️ Se han encontrado ${failures} fallos.`);
    process.exit(1);
}
