# Hanzi Flashcards 汉字卡

Daily spaced-repetition flashcards for the 178 HSK 1 characters — companion to [Hanzi Path](https://bludiamond888-rgb.github.io/hanzi-path/).

- SM-2 scheduling, Again / Hard / Good / Easy, new-cards-per-day limit
- Directions: 字 → meaning, meaning → 字, pīnyīn → 字, mixed
- zh-CN pronunciation via the Web Speech API (when the device has a voice)
- Deck browser with tone-insensitive search, progress stats, streak, review heatmap
- All data on device (localStorage); JSON backup / restore
- Installable PWA, offline via a versioned service worker cache

Character data (`src/data/hsk1.json`) is copied from Hanzi Path. No "write it" link: Hanzi Path has no per-character deep link yet.

```
npm ci && npm run dev     # develop
npm test                  # vitest (SRS logic)
npm run build && npx playwright test   # WebKit screenshots → screens/ (440×956 @3x)
npm run icons             # re-render PNG icons from public/icons/icon.svg
```
