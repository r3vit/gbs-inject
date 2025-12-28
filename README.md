# GBS Inject

**Short summary**

GBS Inject is a small POC helper script for GB Studio web builds that allows you to patch hardcoded ROM strings at runtime in the browser. It is particularly useful for injecting localized or dynamic text (for example, the current weather) into a running web-exported game without rebuilding the ROM binary.

---

## Quick usage

1. **Add placeholder strings to your game**
   - Create the dialogue or text entries you want to replace at runtime and set their content to a unique placeholder (for example: `line1-var_TEST000001`, `line2-var_TEST000002`, `line3-var_TEST000003`). These exact placeholders must exist verbatim in the compiled ROM.

2. **Build/export the game for web**
   - Export your GB Studio project to the web build (the `build/web/` folder).

3. **Copy `gb_api.js` into the web build**
   - Place into `inject/build/web/js/gb_api.js` (the provided script) so it is served together with the game. The repository already contains an example at `inject/build/web/js/gb_api.js` without all the build files.

4. **Include the script in `index.html`**
   - Add a script tag to `build/web/index.html` (or the page that hosts the emulator):

```html
<script src="js/gb_api.js"></script>
```

> Tip: The file must be loaded in the page that runs the emulator so the script can access the `emulator` object.

---

## How it works (short)

- The script waits for the emulator runtime to be available and then scans a slice of the emulator's ROM memory (
`emulator.module.HEAPU8.buffer`) for byte sequences that match the placeholder strings (encoded via `TextEncoder`).
- When a placeholder is found, the script overwrites that text in the emulator memory with the replacement text provided by `replaceROMText(placeholder, replacement)` (padding with spaces when needed).
- This only modifies the in-memory view of the ROM while the emulator runs in the browser — it does not change the saved ROM file on disk.

---

## Example: Live weather injection (from the example in `gb_api.js`)

The repository includes an example that fetches current weather for Milan and injects it into three lines of dialogue after a short delay:

- After a 10s delay it calls the Open-Meteo API for coordinates `45.4643, 9.1895`.
- It maps `weathercode` into a simple text status (`clear`, `cloudy`, `rain`, `snow`, `storm`) and builds a `weather` string such as `"rain, 12 degrees"`.
- Finally it calls `replaceROMText` on three placeholders used in the game:

```js
replaceROMText("line1-var_TEST000001", "Now...");
replaceROMText("line2-var_TEST000002", "the weather in Milan is...");
replaceROMText("line3-var_TEST000003", weather);
```

Make sure you created matching placeholders in your game's dialogues; otherwise the function will log a warning that the placeholder wasn't found.

---

## ⚠️ Strong limitations (read carefully)

- **Exact match required**: The placeholder text must match exactly what is stored in the compiled ROM. If GB Studio stores strings differently (escaped characters, null-termination, or different encoding), the placeholder may not be found.
- **Fixed scan range**: The script scans a fixed 4MB range of the emulator memory (as in the example). If your ROM layout differs, you might need to adjust the search range in `gb_api.js`.
- **No expansion of ROM space**: You cannot replace a shorter placeholder with a longer string without overwriting subsequent data. The script pads with spaces if the replacement is shorter; longer replacements will be truncated or will overwrite adjacent data — use with caution.
- **Works in-memory only**: Changes are applied to the emulator memory during the current session only. They are not persisted back to the original ROM file.
- **Emulator dependency**: The script expects a global `emulator` object and access to `emulator.module.HEAPU8.buffer`. If your hosting environment or a different GB Studio version exposes memory differently, the script may not work.
- **Network & privacy**: Example code fetches external APIs (e.g., Open-Meteo). This requires network access and may be subject to CORS policies and privacy considerations.

---

## Troubleshooting & tips

- Use very distinctive placeholder strings to avoid accidental matches.
- If replacements aren’t found, inspect the game’s compiled text (or search the exported build) to verify the exact bytes of the placeholder.
- Consider improving the emulator-ready detection in `gb_api.js` (e.g., polling `window.emulator` or listening for specific events) if your build loads slowly.
