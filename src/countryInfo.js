import { nameFix } from "./nameFix.js";

export async function getCountryInfo(name) {
    const cleanName = nameFix[name] || name; // fallback to original
    const encoded = encodeURIComponent(cleanName);

    try {
        const basicRes = await fetch(
            `https://restcountries.com/v3.1/name/${encoded}`
        );

        if (!basicRes.ok) throw new Error("Country not found");

        const basicData = await basicRes.json();
        const country = basicData[0];

        const flag = country.flags?.png || "";

        const population = country.population?.toLocaleString() || "Unknown";
        const area = country.area ? country.area.toLocaleString() + " km²" : "Unknown";

        const wbCode = country.cca2;

        const gdpRes = await fetch(
            `https://api.worldbank.org/v2/country/${wbCode}/indicator/NY.GDP.MKTP.CD?format=json`
        );
        const gdpData = await gdpRes.json();

        let gdp = "Unknown";
        if (Array.isArray(gdpData) && gdpData[1]) {
            const latest = gdpData[1].find(item => item.value != null);
            if (latest) {
                gdp = "$" + Number(latest.value).toLocaleString();
            }
        }

        return {
            name: cleanName,
            code: country.cca2,
            flag,
            population,
            area,
            gdp
        };

    } catch (e) {
        console.error("Failed to fetch info:", e);
        return null;
    }
}
