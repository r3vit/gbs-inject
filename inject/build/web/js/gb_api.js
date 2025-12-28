/**
 * GB Studio Web API
 * Specifically optimized for GBS 4.1.3
 */

(function (window) {
    /** 
     * --- TEXT API (Strings) ---
     * Targets hardcoded ROM strings (e.g., from GBVM / Dialogue Boxes)
     */

    window.replaceROMText = function (placeholder, replacement) {
        if (typeof emulator === 'undefined' || !emulator.romDataPtr) return;

        // Use a Uint8Array view of the emulator's ROM memory
        const romBuffer = new Uint8Array(
            emulator.module.HEAPU8.buffer,
            emulator.romDataPtr,
            4 * 1024 * 1024 // 4MB Scan range
        );

        const target = new TextEncoder().encode(placeholder);
        const source = new TextEncoder().encode(replacement);

        let found = 0;
        for (let i = 0; i < romBuffer.length - target.length; i++) {
            let match = true;
            for (let j = 0; j < target.length; j++) {
                if (romBuffer[i + j] !== target[j]) {
                    match = false;
                    break;
                }
            }

            if (match) {
                // Overwrite the placeholder
                for (let j = 0; j < target.length; j++) {
                    romBuffer[i + j] = (j < source.length) ? source[j] : 32; // Pad with spaces
                }
                found++;
            }
        }

        if (found > 0) {
            console.log(`Successfully patched "${placeholder}" with "${replacement}" (${found} matches).`);
        } else {
            console.warn(`Placeholder "${placeholder}" not found in ROM memory.`);
        }
    };

})(window);

setTimeout(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=45.4643&longitude=9.1895&current_weather=true")
        .then(r => r.json())
        .then(d => {
            const t = Math.round(d.current_weather.temperature);
            const c = d.current_weather.weathercode;

            // super-simple weather types
            let status = "clear";
            if (c >= 51 && c <= 67) status = "rain";
            if (c >= 71 && c <= 77) status = "snow";
            if (c >= 80) status = "storm";
            if (c >= 2 && c <= 48) status = "cloudy";

            weather = `${status}, ${t} degrees`;
            replaceROMText("line1-var_TEST000001", "Now...");
            replaceROMText("line2-var_TEST000002", "the weather in Milan is...");
            replaceROMText("line3-var_TEST000003", weather);
        });
}, 10000);
