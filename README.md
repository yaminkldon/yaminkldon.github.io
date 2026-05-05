# yaminkldon.github.io

Personal website hosted on GitHub Pages.

---

## 💪 GymTracker — Workout Tracker App

A **mobile-first, offline-capable** personal workout tracker built with plain HTML/CSS/JS. No backend, no account required.

**Live URL:** `https://yaminkldon.github.io/workout/`

### Features

- **Dashboard** — See today's workout, progress bar, and "Next Exercise" with one tap
- **Week View** — Calendar overview of your weekly plan
- **Day View** — Full exercise list for any day with set tracker
- **Exercise Library** — Browse, search, filter all exercises by muscle group
- **Plans** — Create, edit, and switch between multiple workout plans
- **Rest Timer** — Countdown timer with visual ring that auto-starts after sets
- **Export / Import** — Back up your data as JSON or share with friends
- **Share via Link** — Encodes your plan in a URL to share with friends
- **PWA** — Works offline, "Add to Home Screen" on iOS and Android
- **Dark theme** — Mobile-optimised dark UI with large tap targets

### Default Plan (seeded)

4-day Push / Pull / Rest / Legs split, tailored for 120 kg / 181 cm / 21 yo:

| Day | Type | Exercises |
|-----|------|-----------|
| Mon | Push | Warmup → Chest Press, Incline DB Press, Shoulder Press, Triceps Pushdown → Cardio |
| Tue | Pull | Warmup → Lat Pulldown, Seated Row, Biceps Curl, Face Pull → Cardio |
| Wed | Rest | Light walk / Stationary bike / Stretching |
| Thu | Legs | Warmup + Hip mobility → Leg Press, Squat, Plank → Easy walk |

Each exercise includes **sets × reps**, **estimated calories**, **rest time**, **detailed instructions**, and optional **image/video URL**.

### Usage

1. Open `https://yaminkldon.github.io/workout/` on your phone.
2. Tap **"Add to Home Screen"** for the best experience (iOS: Safari share → Add to Home Screen; Android: Chrome menu → Add to Home Screen).
3. On the **Dashboard**, tap **✓ Set Done** to advance through exercises. The rest timer starts automatically.
4. Go to **Plans** to customise days and exercises, or **Exercises** to browse the library.
5. Use **Settings → Export** to back up data, or **Share Active Plan** to send a link to a friend.

### Customising

- **Add an exercise:** Open any Day → tap the **+** button (top-right) → fill in name, sets, reps, calories, instructions, image URL, and YouTube URL.
- **Edit a plan:** Go to **Plans** → tap **⋮** on any plan.
- **Change your profile stats:** **Settings → Edit Profile**.

### Sharing with friends

1. **Settings → Share Active Plan** — copies a link containing your plan.
2. Friend opens the link on their phone — data is imported automatically.
3. Or use **Export / Import** to exchange the JSON file directly.

### Tech Stack

- Plain HTML5 + CSS3 + Vanilla JS (ES2020)
- localStorage for persistence
- Service Worker for offline support
- PWA manifest for "Add to Home Screen"
- No build step, no dependencies, no framework
