# HANGER App — Setup Guide
> For someone building with AI, no coding experience needed.

---

## What you have right now

```
hanger-app/
├── App.js                          ← Entry point, navigation lives here
├── package.json                    ← Dependency list
└── src/
    └── screens/
        └── SplashScreen.jsx        ← Screen 1 (Splash) ✅
```

---

## Step 1 — Install the tools (do this once)

### 1a. Install Node.js
Go to https://nodejs.org → download the **LTS** version → install it.

### 1b. Install Expo CLI
Open Terminal (Mac) or Command Prompt (Windows) and run:
```
npm install -g expo-cli
```

### 1c. Install Expo Go on your phone
Download **Expo Go** from the App Store or Google Play.
This lets you see your app live on your phone as you build.

---

## Step 2 — Set up the project

Open Terminal, navigate to this folder, then run:

```bash
# Install all dependencies
npm install

# Start the development server
npx expo start
```

A QR code will appear. Scan it with your phone's camera (iOS) 
or the Expo Go app (Android) to see the app live.

---

## Step 3 — How to build the next screens using Claude

For each new screen, open Claude and say something like:

> "I'm building a React Native app called Hanger using Expo. 
>  It uses BebasNeue_400Regular and DM_Sans fonts, and our 
>  color palette is: bg #0A0A0B, accent #E8341A, surface #141416.
>  Please build Screen 2 — the Onboarding screen — as a .jsx file
>  matching this design: [paste the design description or screenshot]"

Then paste the file Claude gives you into `/src/screens/` and 
uncomment its line in `App.js`.

---

## Color palette (copy this into every Claude prompt)

| Name       | Hex       | Use for               |
|------------|-----------|-----------------------|
| bg         | #0A0A0B   | Screen backgrounds    |
| surface    | #141416   | Cards, inputs         |
| accent     | #E8341A   | Buttons, scores, logo |
| accentDim  | rgba(232,52,26,0.15) | Glows, highlights |
| textMid    | rgba(255,255,255,0.55) | Body text       |
| textDim    | rgba(255,255,255,0.30) | Hints, labels   |
| border     | rgba(255,255,255,0.07) | Card borders    |

## Fonts
- **Bebas Neue** — headings, scores, logo (all caps display)
- **DM Sans Light/Regular/Medium** — body, labels, buttons

---

## Screens to build next

| Screen | File name | Status |
|--------|-----------|--------|
| 1. Splash | SplashScreen.jsx | ✅ Done |
| 2. Onboarding | OnboardingScreen.jsx | ⬜ Next |
| 3. Home Feed | HomeScreen.jsx | ⬜ |
| 4. AI Judge Upload | JudgeScreen.jsx | ⬜ |
| 5. AI Judge Results | ResultsScreen.jsx | ⬜ |
| 6. Profile | ProfileScreen.jsx | ⬜ |

---

## Troubleshooting

**"Module not found" error** → run `npm install` again  
**Fonts not loading** → make sure `useFonts()` returns true before rendering  
**App not updating** → shake your phone and tap "Reload"  
**Red error screen** → read the message and paste it into Claude — it will fix it  

---

## When you're ready to publish

```bash
# Install EAS (Expo's build tool)
npm install -g eas-cli

# Build for App Store / Google Play
eas build --platform ios
eas build --platform android
```

You'll need an Apple Developer account ($99/yr) for iOS,
and a Google Play account ($25 one-time) for Android.
