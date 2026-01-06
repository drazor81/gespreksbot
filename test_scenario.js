const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001/api/chat';

async function runTest() {
    console.log("--- START TEST: Peter (Student) vs Cliënt (Thuiszorg) ---");

    // Stap 1: Peter maakt een fout (OMA)
    const studentMessage = "Goedemorgen mevrouw. Ik ben Peter. U moet zich echt even wassen vandaag, dat is hygiënischer.";
    console.log(`\nPeter: "${studentMessage}"`);

    // System prompt simulatie (zoals in de app)
    const clientSystemPrompt = `
  Je bent een verwarde oudere in de thuiszorg.
  Leerdoelen: LSD, OMA/ANNA.
  Gedragsregel: Als de student ongevraagd advies geeft (OMA), reageer defensief en geirriteerd: "Dat bepaal ik zelf wel." of "Bemoei je er niet mee."
  Houd het kort.
  `;

    try {
        // 1. Haal reactie cliënt
        const clientResponse = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemPrompt: clientSystemPrompt,
                messages: [{ role: 'user', content: studentMessage }]
            })
        });
        const clientData = await clientResponse.json();
        console.log(`Cliënt: "${clientData.response}"`);

        // Stap 2: Peter vraagt om een tip (Hint Button)
        console.log("\n--- Peter drukt op de TIP knop ---");

        const coachSystemPrompt = `
    Je bent een ervaren praktijkopleider in de zorg.
    Huidige leerdoelen: LSD, OMA/ANNA.
    Analyseer het gesprek. De student gaf ongevraagd advies (OMA).
    Geef een korte tip over welk gedrag beter zou zijn (bijv. ANNA: Altijd Nagaan, Niet Aannemen).
    `;

        const conversationHistory = [
            { role: 'user', content: studentMessage },
            { role: 'assistant', content: clientData.response }
        ];

        const coachResponse = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemPrompt: coachSystemPrompt,
                messages: conversationHistory
            })
        });
        const coachData = await coachResponse.json();
        console.log(`Coach Tip: 💡 "${coachData.response}"`);

    } catch (error) {
        console.error("Fout tijdens test:", error);
    }
}

runTest();
