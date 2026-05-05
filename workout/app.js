/* =============================================================
   GymTracker — Full Application Logic
   =============================================================
   Architecture:
   - DB: data model + localStorage CRUD
   - Router: hash-based navigation
   - Views: render functions per screen
   - App: init + event wiring
   ============================================================= */

'use strict';

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const STORAGE_KEY = 'gymtracker_v2';
const PROGRESS_KEY = 'gymtracker_progress_v2';
const SETTINGS_KEY = 'gymtracker_settings_v2';

const DAY_TYPES = {
  push:   { label: 'Push', color: 'type-push' },
  pull:   { label: 'Pull', color: 'type-pull' },
  legs:   { label: 'Legs', color: 'type-legs' },
  rest:   { label: 'Rest', color: 'type-rest' },
  cardio: { label: 'Cardio', color: 'type-cardio' },
  custom: { label: 'Custom', color: 'type-custom' },
};

const MUSCLE_GROUPS = [
  'chest','back','shoulders','biceps','triceps',
  'legs','glutes','core','cardio','full body','warmup'
];

const WEEK_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const WEEK_DAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

/* ─────────────────────────────────────────────
   DEFAULT DATA
   User: 120 kg, 181 cm, ~21 yo, 4-day Push/Pull/Rest/Legs split
───────────────────────────────────────────── */
function buildDefaultData() {
  const uid = () => Math.random().toString(36).slice(2, 10);

  /* Warmup exercises (shared across days) */
  const warmup = [
    {
      id: 'wu1', name: 'Treadmill Warm-Up Walk',
      muscleGroups: ['cardio'], category: 'warmup',
      sets: 1, reps: null, duration: '5 min', rest: 0, calories: 35,
      instructions: 'Walk at a comfortable pace (4.5–5.5 km/h) on the treadmill at slight incline (2–4%). Keep intensity light-to-moderate — you should be able to speak in full sentences. This elevates heart rate and prepares the cardiovascular system.',
      imageUrl: '', videoUrl: '', notes: ''
    },
    {
      id: 'wu2', name: 'Shoulder Circles',
      muscleGroups: ['shoulders', 'warmup'], category: 'warmup',
      sets: 2, reps: '10 each direction', duration: null, rest: 0, calories: 2,
      instructions: 'Stand tall. Roll both shoulders forward in large circles 10 times, then backward 10 times. Keep movement slow and controlled, gradually increasing range of motion.',
      imageUrl: '', videoUrl: '', notes: ''
    },
    {
      id: 'wu3', name: 'Chest Opener Stretch',
      muscleGroups: ['chest', 'warmup'], category: 'warmup',
      sets: 2, reps: '15 reps', duration: null, rest: 0, calories: 2,
      instructions: 'Hold arms out to sides at shoulder height. Squeeze shoulder blades together bringing arms back, then bring them forward and cross them in front of chest. 15 controlled reps. (Band Pull-Aparts work great here.)',
      imageUrl: '', videoUrl: '', notes: ''
    },
    {
      id: 'wu4', name: 'Hip Hinge (Bodyweight)',
      muscleGroups: ['legs', 'warmup'], category: 'warmup',
      sets: 2, reps: '10 reps', duration: null, rest: 0, calories: 3,
      instructions: 'Stand hip-width apart. Push hips back while keeping back straight and slight knee bend — like a deadlift without weight. Feel the stretch in your hamstrings. Drive hips forward to return. Key: maintain neutral spine.',
      imageUrl: '', videoUrl: '', notes: ''
    },
    {
      id: 'wu5', name: 'Hip Rotation',
      muscleGroups: ['legs', 'warmup'], category: 'warmup',
      sets: 1, reps: '10 each direction', duration: null, rest: 0, calories: 2,
      instructions: 'Stand with hands on hips (or hold a rack for balance). Draw large circles with your hips — 10 clockwise, then 10 counter-clockwise. Opens the hip joint and warms the lower back.',
      imageUrl: '', videoUrl: '', notes: ''
    },
    {
      id: 'wu6', name: 'Glute Bridge',
      muscleGroups: ['glutes', 'warmup'], category: 'warmup',
      sets: 2, reps: '10 reps', duration: null, rest: 15, calories: 4,
      instructions: 'Lie on back with knees bent, feet flat on floor. Drive through heels to lift hips until body forms a straight line from knees to shoulders. Squeeze glutes at the top. Lower slowly. Critical for activating glutes before lower-body and compound lifts.',
      imageUrl: '', videoUrl: '', notes: ''
    },
    {
      id: 'wu7', name: 'Scapular Push-Ups',
      muscleGroups: ['back', 'warmup'], category: 'warmup',
      sets: 2, reps: '10 reps', duration: null, rest: 15, calories: 4,
      instructions: 'Start in a push-up position (arms locked). Without bending elbows, let shoulder blades pinch together (chest drops slightly), then push them apart (back rounds slightly). This warms up the serratus anterior and scapular stabilizers — important for all pressing/pulling.',
      imageUrl: '', videoUrl: '', notes: ''
    },
  ];

  /* Leg-day extra warmup */
  const legWarmupExtra = [
    {
      id: 'wu8', name: 'Leg Swings (Front/Back)',
      muscleGroups: ['legs', 'warmup'], category: 'warmup',
      sets: 1, reps: '10 each leg', duration: null, rest: 0, calories: 3,
      instructions: 'Hold a rack or wall for balance. Swing one leg forward and backward in a controlled pendulum motion, gradually increasing range. 10 swings per leg. Mobilises the hip flexors and hamstrings.',
      imageUrl: '', videoUrl: '', notes: ''
    },
    {
      id: 'wu9', name: 'Bodyweight Squat',
      muscleGroups: ['legs', 'warmup'], category: 'warmup',
      sets: 1, reps: '12 reps', duration: null, rest: 0, calories: 6,
      instructions: 'Feet shoulder-width apart. Squat down keeping chest up, knees tracking toes, weight in heels. Go to parallel or below. Rise back up squeezing glutes. These are warm-up reps — focus on form, not speed.',
      imageUrl: '', videoUrl: '', notes: ''
    },
  ];

  /* Push exercises */
  const pushExercises = [
    ...warmup,
    {
      id: 'p1', name: 'Chest Press (Machine or Barbell)',
      muscleGroups: ['chest', 'triceps', 'shoulders'], category: 'push',
      sets: 3, reps: '10-12', duration: null, rest: 90, calories: 55,
      instructions: `PRIMARY MOVEMENT — Chest Press\n\n1. Set up with back flat against pad, feet on floor.\n2. Grip handles/bar slightly wider than shoulder-width.\n3. Inhale and unrack/grip. Lower the weight slowly (2–3 sec) until elbows reach 90°.\n4. Exhale and press explosively to full extension — don't lock out hard.\n5. Maintain wrist alignment with forearms throughout.\n\nTIP: Focus on squeezing the pecs, not just moving weight. Warm up with 2 lighter sets first.`,
      imageUrl: '', videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg', notes: 'Lead exercise — do 2 warm-up sets at 40% & 70% of working weight before 3 working sets'
    },
    {
      id: 'p2', name: 'Incline Dumbbell Press',
      muscleGroups: ['chest', 'shoulders'], category: 'push',
      sets: 3, reps: '10-12', duration: null, rest: 90, calories: 50,
      instructions: `Incline DB Press — Upper Chest Focus\n\n1. Set bench to 30–45° incline.\n2. Hold dumbbells at chest level, palms facing forward.\n3. Press up and slightly inward — dumbbells nearly touch at top.\n4. Lower with control (2 sec down).\n5. Don't let shoulders roll forward at bottom of movement.\n\nTIP: 30° targets upper chest more than 45°. Use a spotter if going heavy.`,
      imageUrl: '', videoUrl: '', notes: ''
    },
    {
      id: 'p3', name: 'Shoulder Press (Dumbbell or Machine)',
      muscleGroups: ['shoulders', 'triceps'], category: 'push',
      sets: 3, reps: '10-12', duration: null, rest: 90, calories: 48,
      instructions: `Shoulder Press\n\n1. Sit upright on bench (back supported).\n2. Hold weights at ear level, elbows at 90°.\n3. Press overhead in a slight arc — don't lock out.\n4. Lower slowly back to start.\n5. Keep core braced — avoid arching lower back.\n\nTIP: Don't flare elbows too far out — keep at ~45° forward of body to protect rotator cuff.`,
      imageUrl: '', videoUrl: '', notes: ''
    },
    {
      id: 'p4', name: 'Triceps Pushdown (Cable)',
      muscleGroups: ['triceps'], category: 'push',
      sets: 3, reps: '10-12', duration: null, rest: 75, calories: 35,
      instructions: `Triceps Pushdown\n\n1. Set cable to high pulley with rope or V-bar attachment.\n2. Stand close, elbows tucked at sides.\n3. Push handles down until arms are fully extended.\n4. Slowly return to 90° — keep upper arms stationary.\n5. Squeeze triceps hard at the bottom.\n\nTIP: Elbows stay fixed — don't let them drift forward. Weight is secondary to form.`,
      imageUrl: '', videoUrl: '', notes: ''
    },
    {
      id: 'p5', name: 'Post-Workout Cardio — Treadmill LISS',
      muscleGroups: ['cardio'], category: 'cardio',
      sets: 1, reps: null, duration: '25 min', rest: 0, calories: 300,
      instructions: `LISS Cardio (Low Intensity Steady State)\n\nSpeed: 4.5–5.5 km/h | Incline: 4–8%\nRPE: 5–6/10 — slightly breathless but can talk\n\nCalorie estimate for 120 kg: 250–350 kcal in 25 min\n\nWeeks 1–2: 20 min\nWeeks 3–4: 25 min\nWeeks 5–6: 30 min\nWeeks 7–8: 30–35 min\n\nAlternative: Stationary bike 25 min (220–320 kcal)`,
      imageUrl: '', videoUrl: '', notes: 'Adjust duration each week — see progression notes'
    }
  ];

  /* Pull exercises */
  const pullExercises = [
    ...warmup,
    {
      id: 'q1', name: 'Lat Pulldown',
      muscleGroups: ['back', 'biceps'], category: 'pull',
      sets: 3, reps: '10-12', duration: null, rest: 90, calories: 50,
      instructions: `Lat Pulldown\n\n1. Sit at machine with thighs under pads. Grip bar slightly wider than shoulders.\n2. Lean back slightly (~15°) and pull bar to upper chest.\n3. Lead with elbows — drive them down and back.\n4. Squeeze lats at bottom. Slowly return to full stretch.\n5. Don't use momentum — control the weight.\n\nTIP: Wide grip targets lats; close neutral grip also hits biceps more.`,
      imageUrl: '', videoUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc', notes: '2 warm-up sets before working sets'
    },
    {
      id: 'q2', name: 'Seated Cable Row',
      muscleGroups: ['back', 'biceps'], category: 'pull',
      sets: 3, reps: '10-12', duration: null, rest: 90, calories: 52,
      instructions: `Seated Row\n\n1. Sit with slight forward lean at start. Pull handles to lower chest/abdomen.\n2. Squeeze shoulder blades together at the end of the pull.\n3. Return slowly with control — feel the stretch in your lats.\n4. Don't round the lower back or use a rocking motion.\n\nTIP: Close neutral-grip attachment emphasises mid-back (rhomboids + traps).`,
      imageUrl: '', videoUrl: '', notes: ''
    },
    {
      id: 'q3', name: 'Biceps Curl (Dumbbell)',
      muscleGroups: ['biceps'], category: 'pull',
      sets: 3, reps: '10-12', duration: null, rest: 75, calories: 32,
      instructions: `Dumbbell Biceps Curl\n\n1. Stand with dumbbells at sides, palms forward.\n2. Curl both arms up toward shoulders — squeeze at top.\n3. Lower slowly (3 sec eccentric) to full stretch.\n4. Keep elbows pinned to sides — no swinging.\n\nTIP: Supinate (twist) wrists as you curl for better biceps activation. Consider alternating arms for core stability.`,
      imageUrl: '', videoUrl: '', notes: ''
    },
    {
      id: 'q4', name: 'Face Pull (Cable)',
      muscleGroups: ['shoulders', 'back'], category: 'pull',
      sets: 3, reps: '12-15', duration: null, rest: 60, calories: 28,
      instructions: `Face Pull — Rear Delt & Rotator Cuff\n\n1. Set cable to face height with rope attachment.\n2. Pull rope toward face, separating hands at the end — elbows flare out.\n3. Hold for 1 second at the fully pulled position.\n4. Return slowly.\n\nTIP: Use lighter weight with perfect form. This is a shoulder health exercise — critical for long-term pressing strength.`,
      imageUrl: '', videoUrl: '', notes: 'Light weight, focus on technique — great for shoulder health'
    },
    {
      id: 'q5', name: 'Post-Workout Cardio — Stationary Bike',
      muscleGroups: ['cardio'], category: 'cardio',
      sets: 1, reps: null, duration: '25 min', rest: 0, calories: 260,
      instructions: `Stationary Bike — Easy on Joints\n\nResistance: moderate | Cadence: 75–90 rpm\nRPE: 5–6/10\n\nCalorie estimate for 120 kg: 220–330 kcal in 25 min\n\nAlternative: Elliptical 25 min (~300 kcal)\n\nProgression: same as Push day cardio`,
      imageUrl: '', videoUrl: '', notes: ''
    }
  ];

  /* Legs exercises */
  const legsExercises = [
    ...warmup,
    ...legWarmupExtra,
    {
      id: 'l1', name: 'Leg Press',
      muscleGroups: ['legs', 'glutes'], category: 'legs',
      sets: 3, reps: '10-12', duration: null, rest: 120, calories: 72,
      instructions: `Leg Press\n\n1. Set feet shoulder-width on platform, toes slightly out.\n2. Lower platform until knees reach ~90° (or slightly below parallel).\n3. Press through heels back to near lockout — don't fully lock knees.\n4. Keep lower back pressed to the pad throughout.\n\nTIP: Don't let knees cave inward. Wider stance targets glutes; narrower targets quads.`,
      imageUrl: '', videoUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ', notes: '2–3 warm-up sets. Heavy compound — rest fully between sets'
    },
    {
      id: 'l2', name: 'Barbell Squat',
      muscleGroups: ['legs', 'glutes', 'core'], category: 'legs',
      sets: 3, reps: '10-12', duration: null, rest: 120, calories: 85,
      instructions: `Barbell Back Squat\n\n1. Bar rests on upper traps (high bar) or rear delts (low bar).\n2. Feet shoulder-to-hip width, toes out 15–30°.\n3. Brace core hard. Descend with chest up — break parallel if possible.\n4. Drive through heels to stand — push knees out.\n5. Take a full breath before each rep (Valsalva).\n\nTIP: At 120 kg bodyweight, going to parallel is excellent. Don't sacrifice form for depth.`,
      imageUrl: '', videoUrl: '', notes: 'Most demanding exercise — prioritise form over weight'
    },
    {
      id: 'l3', name: 'Plank',
      muscleGroups: ['core'], category: 'legs',
      sets: 3, reps: null, duration: '30 sec', rest: 60, calories: 12,
      instructions: `Plank — Core Stability\n\n1. Elbows directly below shoulders.\n2. Body forms a straight line from head to heels.\n3. Squeeze glutes and abs — don't let hips sag or rise.\n4. Breathe steadily.\n\nProgression:\n- Week 1–2: 30 sec\n- Week 3–4: 40 sec\n- Week 5–6: 50 sec\n- Week 7–8: 60 sec`,
      imageUrl: '', videoUrl: '', notes: 'Increase hold time each week'
    },
    {
      id: 'l4', name: 'Post-Workout Walk — Easy',
      muscleGroups: ['cardio'], category: 'cardio',
      sets: 1, reps: null, duration: '10-15 min', rest: 0, calories: 165,
      instructions: `Easy Walk After Leg Day\n\nSpeed: 3.5–4.5 km/h | No incline\nRPE: 3–4/10 — very easy\n\nCalorie estimate for 120 kg: 120–200 kcal in 15 min\n\nWhy easy? Your legs are already fatigued from squats and leg press. Light movement promotes blood flow and recovery.`,
      imageUrl: '', videoUrl: '', notes: 'Keep very light — legs will be tired'
    }
  ];

  /* Rest/Cardio day */
  const restExercises = [
    {
      id: 'r1', name: 'Light Walk (Outdoor or Treadmill)',
      muscleGroups: ['cardio'], category: 'cardio',
      sets: 1, reps: null, duration: '25-35 min', rest: 0, calories: 380,
      instructions: `Active Recovery Walk\n\nPace: comfortable, conversational (3.5–5 km/h)\nNo incline needed today.\n\nCalorie estimate for 120 kg:\n- 25 min: ~280 kcal\n- 30 min: ~335 kcal\n- 35 min: ~390 kcal\n\nGoal: Move your body, get fresh air, promote recovery. Don't push hard — this is a rest day.`,
      imageUrl: '', videoUrl: '', notes: ''
    },
    {
      id: 'r2', name: 'Stationary Bike (Optional)',
      muscleGroups: ['cardio'], category: 'cardio',
      sets: 1, reps: null, duration: '25-30 min', rest: 0, calories: 320,
      instructions: `Stationary Bike — Rest Day Option\n\nResistance: light to moderate\nRPE: 4–5/10\n\nCalorie estimate for 120 kg: 250–380 kcal\n\nChoose this over walking if weather is bad or joints feel sore.`,
      imageUrl: '', videoUrl: '', notes: 'Choose either walk or bike, not both'
    },
    {
      id: 'r3', name: 'Stretching & Foam Rolling',
      muscleGroups: ['full body'], category: 'rest',
      sets: 1, reps: null, duration: '10-15 min', rest: 0, calories: 30,
      instructions: `Recovery Stretching\n\nFocus areas based on previous days:\n- After Push day: chest doorway stretch, tricep stretch\n- After Pull day: lat side stretch, bicep wall stretch\n- After Legs day: hip flexor lunge stretch, hamstring stretch, quad stretch\n\nFoam roll each major muscle group 30–60 seconds.\nNever stretch to pain — only to comfortable tension.`,
      imageUrl: '', videoUrl: '', notes: 'Highly recommended — improves recovery'
    }
  ];

  /* Build days */
  const days = [
    {
      id: 'day_push', name: 'Push Day — Chest & Triceps',
      type: 'push', weekDayIndex: 1, // Monday
      exercises: pushExercises.map(e => e.id),
      notes: 'Focus on chest contraction. Warm up sets before heavy compounds.'
    },
    {
      id: 'day_pull', name: 'Pull Day — Back & Biceps',
      type: 'pull', weekDayIndex: 2, // Tuesday
      exercises: pullExercises.map(e => e.id),
      notes: 'Squeeze back muscles on every rep. Don\'t ego-lift on rows.'
    },
    {
      id: 'day_rest', name: 'Rest / Light Cardio',
      type: 'rest', weekDayIndex: 3, // Wednesday
      exercises: restExercises.map(e => e.id),
      notes: 'Active recovery day. Keep intensity very low.'
    },
    {
      id: 'day_legs', name: 'Legs & Core',
      type: 'legs', weekDayIndex: 4, // Thursday
      exercises: legsExercises.map(e => e.id),
      notes: 'Most demanding day. Rest 2 min between heavy sets.'
    },
  ];

  /* Build exercise library (unique) */
  const allExercises = [
    ...warmup,
    ...legWarmupExtra,
    ...pushExercises.filter(e => !warmup.find(w => w.id === e.id)),
    ...pullExercises.filter(e => !warmup.find(w => w.id === e.id)),
    ...legsExercises.filter(e => !warmup.find(w => w.id === e.id) && !legWarmupExtra.find(w => w.id === e.id)),
    ...restExercises,
  ];

  const exerciseMap = {};
  allExercises.forEach(e => { exerciseMap[e.id] = e; });

  const plan = {
    id: 'plan_default',
    name: '4-Day Push/Pull/Rest/Legs',
    days: days.map(d => d.id),
    description: 'Classic 4-day split with warmup, cardio, and progressive overload. Tailored for 120 kg / 181 cm at 21 years old.',
    createdAt: new Date().toISOString(),
    isDefault: true,
  };

  return {
    plans: { [plan.id]: plan },
    days: Object.fromEntries(days.map(d => [d.id, d])),
    exercises: exerciseMap,
    activePlanId: plan.id,
  };
}

/* ─────────────────────────────────────────────
   DATABASE (localStorage)
───────────────────────────────────────────── */
const DB = {
  data: null,

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.data = raw ? JSON.parse(raw) : null;
    } catch { this.data = null; }
    if (!this.data) {
      this.data = buildDefaultData();
      this.save();
    }
  },

  save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); }
    catch (e) { App.toast('Storage full — export your data!', 'warn'); }
  },

  /* ── Plans ── */
  getPlans() { return Object.values(this.data.plans); },
  getPlan(id) { return this.data.plans[id] || null; },
  getActivePlan() { return this.data.plans[this.data.activePlanId] || this.getPlans()[0] || null; },
  setActivePlan(id) { this.data.activePlanId = id; this.save(); },

  savePlan(plan) {
    if (!plan.id) plan.id = 'plan_' + Math.random().toString(36).slice(2, 8);
    if (!plan.createdAt) plan.createdAt = new Date().toISOString();
    this.data.plans[plan.id] = plan;
    this.save();
    return plan;
  },
  deletePlan(id) {
    delete this.data.plans[id];
    if (this.data.activePlanId === id) {
      const remaining = Object.keys(this.data.plans);
      this.data.activePlanId = remaining[0] || null;
    }
    this.save();
  },

  /* ── Days ── */
  getDay(id) { return this.data.days[id] || null; },
  getDays(ids) { return (ids || []).map(id => this.data.days[id]).filter(Boolean); },

  saveDay(day) {
    if (!day.id) day.id = 'day_' + Math.random().toString(36).slice(2, 8);
    if (!day.exercises) day.exercises = [];
    this.data.days[day.id] = day;
    this.save();
    return day;
  },
  deleteDay(id) { delete this.data.days[id]; this.save(); },

  /* ── Exercises ── */
  getExercise(id) { return this.data.exercises[id] || null; },
  getAllExercises() { return Object.values(this.data.exercises); },

  saveExercise(ex) {
    if (!ex.id) ex.id = 'ex_' + Math.random().toString(36).slice(2, 8);
    this.data.exercises[ex.id] = ex;
    this.save();
    return ex;
  },
  deleteExercise(id) { delete this.data.exercises[id]; this.save(); },

  /* ── Import/Export ── */
  export() {
    return JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), ...this.data }, null, 2);
  },
  import(jsonStr) {
    const parsed = JSON.parse(jsonStr);
    if (!parsed.plans || !parsed.days || !parsed.exercises) throw new Error('Invalid data format');
    const { plans, days, exercises, activePlanId } = parsed;
    this.data = { plans, days, exercises, activePlanId: activePlanId || Object.keys(plans)[0] };
    this.save();
  },
  reset() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PROGRESS_KEY);
    this.load();
  }
};

/* ─────────────────────────────────────────────
   PROGRESS (localStorage, per-day tracking)
───────────────────────────────────────────── */
const Progress = {
  _data: null,

  load() {
    try { this._data = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); }
    catch { this._data = {}; }
  },

  save() {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(this._data)); }
    catch {}
  },

  todayKey() { return new Date().toISOString().slice(0, 10); },

  getToday(dayId) {
    const key = this.todayKey() + '_' + dayId;
    return this._data[key] || { dayId, currentIndex: 0, completedSets: {}, done: false };
  },

  setToday(dayId, prog) {
    const key = this.todayKey() + '_' + dayId;
    this._data[key] = prog;
    this.save();
  },

  advanceExercise(dayId) {
    const day = DB.getDay(dayId);
    if (!day) return;
    const prog = this.getToday(dayId);
    if (prog.currentIndex < day.exercises.length - 1) {
      prog.currentIndex++;
    } else {
      prog.done = true;
    }
    this.setToday(dayId, prog);
    return prog;
  },

  completeSet(dayId, exId) {
    const prog = this.getToday(dayId);
    const ex = DB.getExercise(exId);
    if (!ex) return prog;
    prog.completedSets[exId] = (prog.completedSets[exId] || 0) + 1;
    if (prog.completedSets[exId] >= ex.sets) {
      // auto-advance
      return this.advanceExercise(dayId);
    }
    this.setToday(dayId, prog);
    return prog;
  },

  reset(dayId) {
    const key = this.todayKey() + '_' + dayId;
    delete this._data[key];
    this.save();
  }
};

/* ─────────────────────────────────────────────
   SETTINGS
───────────────────────────────────────────── */
const Settings = {
  defaults: { weight: 120, height: 181, age: 21, weightUnit: 'kg' },

  load() {
    try { return { ...this.defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
    catch { return { ...this.defaults }; }
  },

  save(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...this.load(), ...settings }));
  }
};

/* ─────────────────────────────────────────────
   REST TIMER
───────────────────────────────────────────── */
const Timer = {
  el: null, ringEl: null, textEl: null,
  total: 90, remaining: 90, interval: null, circumference: 276.46,

  init() {
    this.el = document.getElementById('rest-timer-overlay');
    this.ringEl = document.getElementById('ring-progress');
    this.textEl = document.getElementById('ring-text');
    document.getElementById('timer-skip').addEventListener('click', () => this.stop());
    document.getElementById('timer-minus').addEventListener('click', () => this.adjust(-15));
    document.getElementById('timer-plus').addEventListener('click', () => this.adjust(15));
  },

  start(seconds) {
    this.stop();
    this.total = Math.max(10, seconds);
    this.remaining = this.total;
    this.el.classList.remove('hidden');
    this._update();
    this.interval = setInterval(() => {
      this.remaining--;
      this._update();
      if (this.remaining <= 0) this._done();
    }, 1000);
  },

  adjust(delta) {
    this.remaining = Math.max(5, this.remaining + delta);
    this.total = Math.max(this.total, this.remaining);
    this._update();
  },

  stop() {
    clearInterval(this.interval);
    this.interval = null;
    this.el.classList.add('hidden');
  },

  _update() {
    this.textEl.textContent = this.remaining;
    const ratio = this.remaining / this.total;
    const offset = this.circumference * (1 - ratio);
    this.ringEl.style.strokeDashoffset = offset;
    if (this.remaining <= 5) {
      this.ringEl.style.stroke = '#f44336';
    } else if (this.remaining <= 15) {
      this.ringEl.style.stroke = '#FF9800';
    } else {
      this.ringEl.style.stroke = '#4CAF50';
    }
  },

  _done() {
    this.stop();
    App.toast('⏱ Rest complete — go!', 'success');
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }
};

/* ─────────────────────────────────────────────
   ROUTER
───────────────────────────────────────────── */
const Router = {
  history: [],
  current: null,

  navigate(view, params = {}) {
    this.history.push({ view: this.current, params: Router._currentParams });
    this._go(view, params);
  },

  back() {
    const prev = this.history.pop();
    if (prev && prev.view) this._go(prev.view, prev.params || {});
    else this._go('dashboard', {});
  },

  _go(view, params) {
    this.current = view;
    Router._currentParams = params;
    App.renderView(view, params);
  }
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function youtubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]{11})/);
  return m ? m[1] : null;
}

function totalCalories(dayId) {
  const day = DB.getDay(dayId);
  if (!day) return 0;
  return day.exercises.reduce((sum, exId) => {
    const ex = DB.getExercise(exId);
    return sum + (ex ? (ex.calories || 0) * (ex.sets || 1) : 0);
  }, 0);
}

function formatDuration(dur) {
  if (!dur) return '';
  return dur.toString().includes('min') || dur.toString().includes('sec') ? dur : dur + 's';
}

function getTypeInfo(type) {
  return DAY_TYPES[type] || DAY_TYPES.custom;
}

function todayDayName() {
  return WEEK_DAYS_FULL[new Date().getDay()];
}

function getTodaysDays(plan) {
  /* Map weekDayIndex (0=Sun..6=Sat) to today's day, cycling through plan days */
  const today = new Date().getDay();
  if (!plan) return [];
  return DB.getDays(plan.days).filter(d => d.weekDayIndex === today);
}

function getDateForWeekOffset(offset, dayOfWeek) {
  const now = new Date();
  const startOfWeek = new Date(now);
  const diff = now.getDay();
  startOfWeek.setDate(now.getDate() - diff + offset * 7);
  const d = new Date(startOfWeek);
  d.setDate(startOfWeek.getDate() + dayOfWeek);
  return d;
}

/* ─────────────────────────────────────────────
   RENDER HELPERS
───────────────────────────────────────────── */
function chevronRight() {
  return `<svg class="ex-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
}

function renderExListItem(ex, index, prog, dayId, isFromDay) {
  if (!ex) return '';
  const isDone = prog && prog.completedSets[ex.id] >= ex.sets;
  const isCurrent = prog && prog.currentIndex === index && !prog.done;
  const numClass = isDone ? 'done' : (isCurrent ? 'current' : '');
  const numContent = isDone ? '' : (index + 1);
  const setsReps = ex.duration ? formatDuration(ex.duration) : `${ex.sets}×${ex.reps}`;
  const calLabel = ex.calories ? `<span class="cal-badge">${ex.calories * (ex.sets || 1)} kcal</span>` : '';

  return `
    <div class="ex-list-item card-pressable"
         data-ex-id="${esc(ex.id)}"
         data-day-id="${esc(dayId || '')}"
         data-ex-index="${index}"
         onclick="App.openExerciseDetail('${esc(ex.id)}', '${esc(dayId || '')}')">
      <div class="ex-num ${numClass}">${numContent}</div>
      <div class="ex-info">
        <div class="ex-info-name">${esc(ex.name)}</div>
        <div class="ex-info-sub">
          <span>${setsReps}</span>
          ${ex.rest ? `<span>Rest: ${ex.rest}s</span>` : ''}
          ${calLabel}
        </div>
      </div>
      ${chevronRight()}
    </div>`;
}

/* ─────────────────────────────────────────────
   VIEW: DASHBOARD
───────────────────────────────────────────── */
function renderDashboard() {
  const plan = DB.getActivePlan();
  const todayDOW = new Date().getDay();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (!plan) {
    return `<div class="empty-state">
      <div class="empty-icon">🏋️</div>
      <div class="empty-title">No Plan Yet</div>
      <div class="empty-sub">Go to Plans to create your first workout plan.</div>
      <br><button class="btn-primary" onclick="Router.navigate('plans')">Create Plan</button>
    </div>`;
  }

  const todayDays = DB.getDays(plan.days).filter(d => d.weekDayIndex === todayDOW);
  const day = todayDays[0] || null;

  /* Hero */
  let html = `<div class="dashboard-hero">
    <div class="hero-date">${dateStr}</div>
    <div class="hero-day-name">${day ? esc(day.name) : 'Rest Day 🛌'}</div>
    <div class="hero-plan-name">${esc(plan.name)}</div>`;

  if (day) {
    const prog = Progress.getToday(day.id);
    const total = day.exercises.length;
    const done = prog.done ? total : prog.currentIndex;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    html += `<div class="hero-progress-wrap">
      <div class="hero-progress-bar-bg"><div class="hero-progress-bar" style="width:${pct}%"></div></div>
      <div class="hero-progress-label">${done}/${total}</div>
    </div>`;
  }
  html += `</div>`;

  /* Next Exercise Card or Completion */
  if (day) {
    const prog = Progress.getToday(day.id);
    const exercises = DB.getDays([day.id])[0]?.exercises || [];
    const exIds = day.exercises;

    if (prog.done) {
      html += `<div class="complete-day-card">
        <h3>🎉 Workout Complete!</h3>
        <p>Great work today. See you next session!</p>
        <br><button class="btn-outline" onclick="Progress.reset('${esc(day.id)}'); App.renderView('dashboard')">Reset Day</button>
      </div>`;
    } else {
      const currentExId = exIds[prog.currentIndex];
      const currentEx = DB.getExercise(currentExId);
      if (currentEx) {
        const setsLeft = (currentEx.sets || 1) - (prog.completedSets[currentExId] || 0);
        const setsReps = currentEx.duration ? formatDuration(currentEx.duration) : `${currentEx.sets} sets × ${currentEx.reps} reps`;
        html += `<div class="next-ex-card card">
          <div class="next-ex-inner">
            <div class="next-ex-eyebrow">
              <span>⚡</span> Next Up — ${prog.currentIndex + 1} of ${exIds.length}
            </div>
            <div class="next-ex-name">${esc(currentEx.name)}</div>
            <div class="next-ex-meta">
              <span>💪 ${setsReps}</span>
              ${currentEx.rest ? `<span>⏱ ${currentEx.rest}s rest</span>` : ''}
              ${currentEx.calories ? `<span class="cal-badge">${currentEx.calories * currentEx.sets} kcal</span>` : ''}
            </div>
            <div class="next-ex-buttons">
              <button class="btn-primary" style="flex:2"
                onclick="App.completeSet('${esc(day.id)}', '${esc(currentEx.id)}')">
                ✓ Set Done ${setsLeft > 1 ? `(${setsLeft} left)` : ''}
              </button>
              ${currentEx.rest ? `<button class="btn-secondary" style="flex:1"
                onclick="Timer.start(${currentEx.rest})">⏱ Rest</button>` : ''}
            </div>
          </div>
        </div>`;
      }
    }

    /* Today's exercise list */
    html += `<div class="page-section">
      <div class="section-title">Today's Exercises</div>
      <div class="card ex-list">`;
    exIds.forEach((exId, i) => {
      const ex = DB.getExercise(exId);
      html += renderExListItem(ex, i, prog, day.id, true);
    });
    html += `</div></div>`;

    /* View full day button */
    html += `<div class="btn-row">
      <button class="btn-secondary" onclick="Router.navigate('day', {dayId:'${esc(day.id)}'})">
        View Full Day →
      </button>
    </div>`;

  } else {
    /* Rest day */
    html += `<div class="page-section">
      <div class="card" style="padding:20px; text-align:center;">
        <div style="font-size:48px; margin-bottom:8px;">🛌</div>
        <div style="font-size:16px; font-weight:600; margin-bottom:6px;">Rest & Recover</div>
        <div class="text-secondary text-small">No workout scheduled today. Rest or do light cardio.</div>
      </div>
    </div>`;
  }

  /* All days quick nav */
  html += `<div class="page-section">
    <div class="section-title">This Week's Plan</div>
    <div class="card">`;
  const allDays = DB.getDays(plan.days);
  allDays.forEach(d => {
    const typeInfo = getTypeInfo(d.type);
    const exCount = d.exercises.length;
    html += `<div class="ex-list-item card-pressable" onclick="Router.navigate('day', {dayId:'${esc(d.id)}'})">
      <div class="ex-num" style="background:var(--border-light)">${WEEK_DAYS[d.weekDayIndex || 0]}</div>
      <div class="ex-info">
        <div class="ex-info-name">${esc(d.name)}</div>
        <div class="ex-info-sub"><span>${exCount} exercises</span></div>
      </div>
      <span class="wdc-type ${typeInfo.color}" style="margin-right:8px">${typeInfo.label}</span>
      ${chevronRight()}
    </div>`;
  });
  html += `</div></div><div class="spacer-16 bottom-safe"></div>`;
  return html;
}

/* ─────────────────────────────────────────────
   VIEW: WEEK
───────────────────────────────────────────── */
let weekOffset = 0;

function renderWeek() {
  const plan = DB.getActivePlan();
  const today = new Date();
  const startOfCurrentWeek = new Date(today);
  startOfCurrentWeek.setDate(today.getDate() - today.getDay());

  const weekStart = new Date(startOfCurrentWeek);
  weekStart.setDate(startOfCurrentWeek.getDate() + weekOffset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekLabel = `${weekStart.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${weekEnd.toLocaleDateString('en-US',{month:'short',day:'numeric', year:'numeric'})}`;

  let html = `<div class="week-header-nav">
    <button class="week-nav-btn" onclick="weekOffset--;App.renderView('week')">‹</button>
    <span>${weekLabel}</span>
    <button class="week-nav-btn" onclick="weekOffset++;App.renderView('week')">›</button>
  </div>
  <div class="week-grid">`;

  const dayNames = WEEK_DAYS;
  for (let dow = 0; dow < 7; dow++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + dow);
    const isToday = d.toDateString() === today.toDateString();

    let planDay = null;
    if (plan) {
      planDay = DB.getDays(plan.days).find(pd => pd.weekDayIndex === dow) || null;
    }
    const typeInfo = planDay ? getTypeInfo(planDay.type) : null;

    html += `<div class="week-day-cell ${isToday ? 'today' : ''}"
      onclick="${planDay ? `Router.navigate('day',{dayId:'${esc(planDay.id)}'})` : ''}">
      <div class="wdc-label">${dayNames[dow]}</div>
      <div class="wdc-num">${d.getDate()}</div>
      ${typeInfo ? `<div class="wdc-type ${typeInfo.color}">${typeInfo.label}</div>` : '<div class="wdc-type type-rest">Rest</div>'}
    </div>`;
  }
  html += `</div>`;

  /* Day list for the week */
  if (plan) {
    html += `<div class="page-section" style="margin-top:8px">
      <div class="section-title">Workout Days</div>
      <div class="card">`;
    DB.getDays(plan.days).forEach(day => {
      const typeInfo = getTypeInfo(day.type);
      const cals = totalCalories(day.id);
      html += `<div class="ex-list-item card-pressable" onclick="Router.navigate('day',{dayId:'${esc(day.id)}'})">
        <div class="ex-num" style="background:var(--border-light)">${WEEK_DAYS[day.weekDayIndex || 0]}</div>
        <div class="ex-info">
          <div class="ex-info-name">${esc(day.name)}</div>
          <div class="ex-info-sub">
            <span>${day.exercises.length} exercises</span>
            ${cals ? `<span class="cal-badge">${cals} kcal</span>` : ''}
          </div>
        </div>
        <span class="wdc-type ${typeInfo.color}" style="margin-right:8px">${typeInfo.label}</span>
        ${chevronRight()}
      </div>`;
    });
    html += `</div></div>`;
  }

  html += `<div class="btn-row">
    <button class="btn-outline" onclick="weekOffset=0;App.renderView('week')">Today</button>
  </div>
  <div class="spacer-16 bottom-safe"></div>`;
  return html;
}

/* ─────────────────────────────────────────────
   VIEW: DAY DETAIL
───────────────────────────────────────────── */
function renderDay(params) {
  const { dayId } = params;
  const day = DB.getDay(dayId);
  if (!day) return `<div class="empty-state"><div class="empty-icon">😢</div><div class="empty-title">Day not found</div></div>`;

  const typeInfo = getTypeInfo(day.type);
  const prog = Progress.getToday(dayId);
  const cals = totalCalories(dayId);
  const exCount = day.exercises.length;

  let html = `<div class="day-hero">
    <span class="day-type-badge ${typeInfo.color}">${typeInfo.label}</span>
    <h2>${esc(day.name)}</h2>
    <div class="day-stats">
      <span class="day-stat">💪 ${exCount} exercises</span>
      ${cals ? `<span class="day-stat cal-badge">${cals} kcal total</span>` : ''}
      ${day.notes ? `<span class="day-stat text-secondary">${esc(day.notes)}</span>` : ''}
    </div>
  </div>`;

  /* Progress bar */
  if (exCount > 0) {
    const done = prog.done ? exCount : prog.currentIndex;
    const pct = Math.round((done / exCount) * 100);
    html += `<div style="padding:10px 16px 0">
      <div style="display:flex;align-items:center;gap:10px">
        <div class="hero-progress-bar-bg" style="flex:1">
          <div class="hero-progress-bar" style="width:${pct}%;background:var(--primary)"></div>
        </div>
        <span class="text-small text-secondary">${done}/${exCount}</span>
      </div>
    </div>`;
  }

  /* Exercise list */
  html += `<div class="section-header">
    <h3>Exercises</h3>
    <button class="section-add-btn" onclick="App.openExerciseEditor(null,'${esc(dayId)}')" aria-label="Add Exercise">+</button>
  </div>
  <div class="card ex-list" style="margin:0 16px">`;

  if (day.exercises.length === 0) {
    html += `<div style="padding:24px;text-align:center;color:var(--text-secondary)">No exercises yet. Tap + to add.</div>`;
  } else {
    day.exercises.forEach((exId, i) => {
      const ex = DB.getExercise(exId);
      html += renderExListItem(ex, i, prog, dayId, true);
    });
  }
  html += `</div>`;

  /* Action buttons */
  html += `<div class="btn-row" style="margin-top:12px">
    <button class="btn-primary" onclick="Router.navigate('dashboard')">Start Workout</button>
    <button class="btn-secondary" onclick="App.editDay('${esc(dayId)}')">Edit Day</button>
  </div>
  <div class="spacer-16 bottom-safe"></div>`;

  return html;
}

/* ─────────────────────────────────────────────
   VIEW: EXERCISE DETAIL
───────────────────────────────────────────── */
function renderExerciseDetail(params) {
  const { exId, dayId } = params;
  const ex = DB.getExercise(exId);
  if (!ex) return `<div class="empty-state"><div class="empty-icon">😢</div><div class="empty-title">Exercise not found</div></div>`;

  const setsLabel = ex.duration ? formatDuration(ex.duration) : `${ex.sets}`;
  const repsLabel = ex.duration ? '—' : (ex.reps || '—');
  const ytId = youtubeId(ex.videoUrl);
  const typeInfo = getTypeInfo(ex.category);

  let html = `<div class="ex-detail-hero">
    <span class="day-type-badge ${typeInfo.color}">${typeInfo.label || ex.category}</span>
    <h2>${esc(ex.name)}</h2>
    <div class="ex-tags">`;
  (ex.muscleGroups || []).forEach(m => { html += `<span class="ex-tag">${esc(m)}</span>`; });
  html += `</div></div>`;

  /* Stats grid */
  html += `<div class="ex-stats-grid">
    <div class="ex-stat-box"><div class="ex-stat-val">${setsLabel}</div><div class="ex-stat-lbl">Sets</div></div>
    <div class="ex-stat-box"><div class="ex-stat-val">${repsLabel}</div><div class="ex-stat-lbl">Reps</div></div>
    <div class="ex-stat-box"><div class="ex-stat-val">${ex.rest || 0}s</div><div class="ex-stat-lbl">Rest</div></div>
    <div class="ex-stat-box"><div class="ex-stat-val">${ex.calories || 0}</div><div class="ex-stat-lbl">kcal/set</div></div>
  </div>`;

  /* Set tracker (if part of a day workout) */
  if (dayId) {
    const prog = Progress.getToday(dayId);
    const completedSets = prog.completedSets[exId] || 0;
    html += `<div class="set-tracker card" style="margin:0 16px">
      <h4>Set Tracker</h4>
      <div class="set-dots">`;
    for (let i = 0; i < (ex.sets || 1); i++) {
      const done = i < completedSets;
      html += `<div class="set-dot ${done ? 'completed' : ''}"
        onclick="App.completeSet('${esc(dayId)}','${esc(exId)}',true)">${done ? '✓' : i+1}</div>`;
    }
    html += `</div>`;
    if (ex.rest) {
      html += `<br><button class="btn-outline full-width" onclick="Timer.start(${ex.rest})">⏱ Start Rest (${ex.rest}s)</button>`;
    }
    html += `</div>`;
  }

  /* Instructions */
  if (ex.instructions) {
    html += `<div class="ex-instructions">
      <h4>Instructions</h4>
      <p style="white-space:pre-wrap">${esc(ex.instructions)}</p>
    </div>`;
  }

  /* Media */
  const hasMedia = ex.imageUrl || ytId;
  if (hasMedia) {
    html += `<div class="ex-media"><h4>Media</h4>`;
    if (ex.imageUrl) {
      html += `<img class="ex-image" src="${esc(ex.imageUrl)}" alt="${esc(ex.name)}" onerror="this.style.display='none'" loading="lazy">`;
    }
    if (ytId) {
      html += `<div class="ex-video-wrap" style="margin-top:${ex.imageUrl?'10px':'0'}">
        <iframe src="https://www.youtube.com/embed/${ytId}?rel=0" allowfullscreen title="${esc(ex.name)}"></iframe>
      </div>`;
    }
    html += `</div>`;
  }

  /* Notes */
  if (ex.notes) {
    html += `<div class="page-section">
      <div class="section-title">Notes</div>
      <div class="card" style="padding:12px 14px;font-size:14px;line-height:1.6">${esc(ex.notes)}</div>
    </div>`;
  }

  /* Action buttons */
  html += `<div class="btn-row">
    <button class="btn-secondary" onclick="App.openExerciseEditor('${esc(exId)}', '${esc(dayId||'')}')">Edit Exercise</button>
    ${dayId ? `<button class="btn-danger" onclick="App.removeExFromDay('${esc(dayId)}','${esc(exId)}')">Remove from Day</button>` : ''}
  </div>
  <div class="spacer-16 bottom-safe"></div>`;

  return html;
}

/* ─────────────────────────────────────────────
   VIEW: EXERCISE LIBRARY
───────────────────────────────────────────── */
let libFilter = 'all';
let libSearch = '';

function renderLibrary() {
  const exercises = DB.getAllExercises();
  const chips = ['all', ...MUSCLE_GROUPS];

  let html = `<div class="search-bar">
    <input class="search-input" type="search" placeholder="Search exercises…" 
      value="${esc(libSearch)}" id="lib-search"
      oninput="libSearch=this.value;App.renderView('library')" />
  </div>
  <div class="filter-chips">`;
  chips.forEach(c => {
    html += `<button class="filter-chip ${libFilter===c?'active':''}"
      onclick="libFilter='${c}';App.renderView('library')">${c.charAt(0).toUpperCase()+c.slice(1)}</button>`;
  });
  html += `</div>`;

  /* Filter */
  let filtered = exercises;
  if (libFilter !== 'all') {
    filtered = filtered.filter(e => (e.muscleGroups || []).includes(libFilter) || e.category === libFilter);
  }
  if (libSearch) {
    const q = libSearch.toLowerCase();
    filtered = filtered.filter(e => e.name.toLowerCase().includes(q) || (e.muscleGroups || []).join(' ').includes(q));
  }

  if (filtered.length === 0) {
    html += `<div class="empty-state">
      <div class="empty-icon">🔍</div>
      <div class="empty-title">No exercises found</div>
      <div class="empty-sub">Try a different search or filter.</div>
    </div>`;
  } else {
    /* Group by category */
    const groups = {};
    filtered.forEach(e => {
      const g = e.category || 'custom';
      if (!groups[g]) groups[g] = [];
      groups[g].push(e);
    });

    Object.entries(groups).forEach(([group, exs]) => {
      html += `<div class="muscle-group-section">
        <div class="muscle-group-title">${group.toUpperCase()}</div>
        <div class="card ex-list" style="margin:0 16px">`;
      exs.forEach((ex, i) => {
        const setsReps = ex.duration ? formatDuration(ex.duration) : `${ex.sets}×${ex.reps}`;
        html += `<div class="ex-list-item card-pressable"
          onclick="Router.navigate('exercise',{exId:'${esc(ex.id)}',fromLibrary:true})">
          <div class="ex-num">${i+1}</div>
          <div class="ex-info">
            <div class="ex-info-name">${esc(ex.name)}</div>
            <div class="ex-info-sub">
              <span>${setsReps}</span>
              <span>${(ex.muscleGroups||[]).slice(0,2).join(', ')}</span>
              ${ex.calories ? `<span class="cal-badge">${ex.calories} kcal</span>` : ''}
            </div>
          </div>
          ${chevronRight()}
        </div>`;
      });
      html += `</div><div class="spacer-8"></div>`;
    });
  }

  html += `<div class="spacer-16 bottom-safe"></div>`;
  return html;
}

/* ─────────────────────────────────────────────
   VIEW: PLANS
───────────────────────────────────────────── */
function renderPlans() {
  const plans = DB.getPlans();
  const activePlan = DB.getActivePlan();

  let html = `<div class="page-section">
    <div class="section-title">My Plans</div>`;

  if (plans.length === 0) {
    html += `<div class="empty-state">
      <div class="empty-icon">📋</div>
      <div class="empty-title">No plans yet</div>
      <div class="empty-sub">Create your first workout plan.</div>
    </div>`;
  } else {
    plans.forEach(plan => {
      const isActive = plan.id === activePlan?.id;
      const days = DB.getDays(plan.days);
      html += `<div class="plan-card" style="margin-bottom:12px;${isActive?'border-color:var(--primary)':''}">
        <div class="plan-card-header">
          <h3>${esc(plan.name)}</h3>
          ${isActive ? '<span style="color:var(--primary);font-size:12px;font-weight:700">ACTIVE</span>' : ''}
          <button class="icon-btn" onclick="App.showPlanMenu('${esc(plan.id)}')" aria-label="Plan options">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
          </button>
        </div>
        <div class="plan-card-body">`;
      days.forEach(day => {
        const typeInfo = getTypeInfo(day.type);
        html += `<div class="plan-day-item" onclick="Router.navigate('day',{dayId:'${esc(day.id)}'})">
          <div class="plan-day-num">${WEEK_DAYS[day.weekDayIndex||0]}</div>
          <div class="plan-day-info">
            <div class="plan-day-name">${esc(day.name)}</div>
            <div class="plan-day-sub">${day.exercises.length} exercises · ${totalCalories(day.id)} kcal</div>
          </div>
          <span class="wdc-type ${typeInfo.color}">${typeInfo.label}</span>
          ${chevronRight()}
        </div>`;
      });
      if (days.length === 0) {
        html += `<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:14px">No days added yet</div>`;
      }
      html += `</div>`;
      if (!isActive) {
        html += `<div style="padding:10px 16px">
          <button class="btn-outline full-width" onclick="DB.setActivePlan('${esc(plan.id)}');App.renderView('plans')">Set as Active</button>
        </div>`;
      }
      html += `</div>`;
    });
  }

  html += `</div>
  <div class="btn-row">
    <button class="btn-primary" onclick="App.createNewPlan()">+ New Plan</button>
  </div>
  <div class="spacer-16 bottom-safe"></div>`;
  return html;
}

/* ─────────────────────────────────────────────
   VIEW: SETTINGS
───────────────────────────────────────────── */
function renderSettings() {
  const s = Settings.load();
  return `
  <div class="user-stats-grid">
    <div class="user-stat-box">
      <div class="user-stat-val">${s.weight}</div>
      <div class="user-stat-lbl">Weight (${s.weightUnit})</div>
    </div>
    <div class="user-stat-box">
      <div class="user-stat-val">${s.height}</div>
      <div class="user-stat-lbl">Height (cm)</div>
    </div>
    <div class="user-stat-box">
      <div class="user-stat-val">${s.age}</div>
      <div class="user-stat-lbl">Age</div>
    </div>
  </div>

  <div class="settings-section">
    <div class="section-title">Profile</div>
    <div class="settings-card">
      <div class="settings-row" onclick="App.editProfile()">
        <div class="settings-row-icon icon-blue">👤</div>
        <div class="settings-row-text">
          <div class="settings-row-label">Edit Profile</div>
          <div class="settings-row-sub">Weight, height, age</div>
        </div>
        ${chevronRight()}
      </div>
    </div>
  </div>

  <div class="settings-section">
    <div class="section-title">Data</div>
    <div class="settings-card">
      <div class="settings-row" onclick="App.exportData()">
        <div class="settings-row-icon icon-green">📤</div>
        <div class="settings-row-text">
          <div class="settings-row-label">Export Data</div>
          <div class="settings-row-sub">Download all plans as JSON</div>
        </div>
        ${chevronRight()}
      </div>
      <div class="settings-row" onclick="App.importData()">
        <div class="settings-row-icon icon-blue">📥</div>
        <div class="settings-row-text">
          <div class="settings-row-label">Import Data</div>
          <div class="settings-row-sub">Restore or load shared plan</div>
        </div>
        ${chevronRight()}
      </div>
      <div class="settings-row" onclick="App.shareViaLink()">
        <div class="settings-row-icon icon-orange">🔗</div>
        <div class="settings-row-text">
          <div class="settings-row-label">Share Active Plan</div>
          <div class="settings-row-sub">Copy shareable link</div>
        </div>
        ${chevronRight()}
      </div>
    </div>
  </div>

  <div class="settings-section">
    <div class="section-title">Danger Zone</div>
    <div class="settings-card">
      <div class="settings-row" onclick="App.confirmReset()">
        <div class="settings-row-icon icon-red">🗑️</div>
        <div class="settings-row-text">
          <div class="settings-row-label text-danger">Reset All Data</div>
          <div class="settings-row-sub">Restore default plan — cannot undo</div>
        </div>
        ${chevronRight()}
      </div>
    </div>
  </div>

  <div class="settings-section">
    <div class="settings-card" style="padding:14px 16px">
      <div style="font-size:14px;font-weight:600;margin-bottom:4px">GymTracker 💪</div>
      <div class="text-secondary text-small">Personal workout tracker · v2.0<br>Works offline · No account required</div>
    </div>
  </div>
  <div class="spacer-16 bottom-safe"></div>`;
}

/* ─────────────────────────────────────────────
   EXERCISE EDITOR MODAL
───────────────────────────────────────────── */
function renderExerciseEditorModal(exId, dayId) {
  const ex = exId ? DB.getExercise(exId) : null;
  const isNew = !ex;
  const title = isNew ? 'New Exercise' : 'Edit Exercise';

  const muscleOptions = MUSCLE_GROUPS.map(m =>
    `<option value="${m}" ${(ex?.muscleGroups||[]).includes(m)?'selected':''}>${m}</option>`
  ).join('');

  return `
  <div class="modal-header">
    <h3>${title}</h3>
    <button class="modal-close" onclick="App.closeModal()">×</button>
  </div>
  <div class="form-body">
    <div class="form-group">
      <label class="form-label">Exercise Name *</label>
      <input class="form-input" id="ex-name" placeholder="e.g. Bench Press" value="${esc(ex?.name||'')}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-select" id="ex-category">
          ${Object.entries(DAY_TYPES).map(([k,v])=>`<option value="${k}" ${ex?.category===k?'selected':''}>${v.label}</option>`).join('')}
          <option value="warmup" ${ex?.category==='warmup'?'selected':''}>Warmup</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Muscle Groups</label>
        <select class="form-select" id="ex-muscles" multiple style="height:80px">${muscleOptions}</select>
      </div>
    </div>
    <div class="form-row-3">
      <div class="form-group">
        <label class="form-label">Sets</label>
        <input class="form-input" id="ex-sets" type="number" min="1" max="20" value="${ex?.sets||3}" />
      </div>
      <div class="form-group">
        <label class="form-label">Reps</label>
        <input class="form-input" id="ex-reps" placeholder="e.g. 10-12" value="${esc(ex?.reps||'')}" />
      </div>
      <div class="form-group">
        <label class="form-label">Duration</label>
        <input class="form-input" id="ex-duration" placeholder="e.g. 30 sec" value="${esc(ex?.duration||'')}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Rest (seconds)</label>
        <input class="form-input" id="ex-rest" type="number" min="0" value="${ex?.rest||90}" />
      </div>
      <div class="form-group">
        <label class="form-label">Calories / set</label>
        <input class="form-input" id="ex-calories" type="number" min="0" value="${ex?.calories||0}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Instructions</label>
      <textarea class="form-textarea" id="ex-instructions" rows="4" placeholder="How to perform this exercise…">${esc(ex?.instructions||'')}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Image URL</label>
      <input class="form-input" id="ex-image" type="url" placeholder="https://…" value="${esc(ex?.imageUrl||'')}" />
    </div>
    <div class="form-group">
      <label class="form-label">YouTube / Video URL</label>
      <input class="form-input" id="ex-video" type="url" placeholder="https://youtube.com/watch?v=…" value="${esc(ex?.videoUrl||'')}" />
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <input class="form-input" id="ex-notes" placeholder="Optional notes…" value="${esc(ex?.notes||'')}" />
    </div>
  </div>
  <div class="modal-footer">
    <button class="btn-secondary" onclick="App.closeModal()">Cancel</button>
    <button class="btn-primary" onclick="App.saveExercise('${esc(exId||'')}','${esc(dayId||'')}')">
      ${isNew ? 'Add Exercise' : 'Save Changes'}
    </button>
  </div>`;
}

/* ─────────────────────────────────────────────
   DAY EDITOR MODAL
───────────────────────────────────────────── */
function renderDayEditorModal(dayId) {
  const day = dayId ? DB.getDay(dayId) : null;
  const plan = DB.getActivePlan();
  const isNew = !day;

  return `
  <div class="modal-header">
    <h3>${isNew ? 'New Day' : 'Edit Day'}</h3>
    <button class="modal-close" onclick="App.closeModal()">×</button>
  </div>
  <div class="form-body">
    <div class="form-group">
      <label class="form-label">Day Name *</label>
      <input class="form-input" id="day-name" placeholder="e.g. Push Day — Chest & Triceps" value="${esc(day?.name||'')}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Type</label>
        <select class="form-select" id="day-type">
          ${Object.entries(DAY_TYPES).map(([k,v])=>`<option value="${k}" ${day?.type===k?'selected':''}>${v.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Day of Week</label>
        <select class="form-select" id="day-dow">
          ${WEEK_DAYS_FULL.map((d,i)=>`<option value="${i}" ${day?.weekDayIndex===i?'selected':''}>${d}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <input class="form-input" id="day-notes" placeholder="Optional notes for this day…" value="${esc(day?.notes||'')}" />
    </div>
    ${day && day.exercises.length > 0 ? `
    <div class="form-group">
      <label class="form-label">Exercises (${day.exercises.length})</label>
      <div class="card" style="max-height:180px;overflow-y:auto">
        ${day.exercises.map((exId,i) => {
          const ex = DB.getExercise(exId);
          return ex ? `<div class="ex-list-item" style="padding:10px 14px">
            <div class="ex-num">${i+1}</div>
            <div class="ex-info"><div class="ex-info-name">${esc(ex.name)}</div></div>
            <button onclick="App.removeExFromDayModal('${esc(day.id)}','${esc(exId)}')" style="color:var(--danger);background:none;border:none;font-size:18px;cursor:pointer;padding:4px">×</button>
          </div>` : '';
        }).join('')}
      </div>
    </div>` : ''}
  </div>
  <div class="modal-footer">
    ${day ? `<button class="btn-danger" onclick="App.deleteDayConfirm('${esc(dayId)}')">Delete</button>` : '<div></div>'}
    <button class="btn-primary" onclick="App.saveDay('${esc(dayId||'')}')">
      ${isNew ? 'Create Day' : 'Save'}
    </button>
  </div>`;
}

/* ─────────────────────────────────────────────
   PLAN EDITOR MODAL
───────────────────────────────────────────── */
function renderPlanEditorModal(planId) {
  const plan = planId ? DB.getPlan(planId) : null;
  const isNew = !plan;

  return `
  <div class="modal-header">
    <h3>${isNew ? 'New Plan' : 'Edit Plan'}</h3>
    <button class="modal-close" onclick="App.closeModal()">×</button>
  </div>
  <div class="form-body">
    <div class="form-group">
      <label class="form-label">Plan Name *</label>
      <input class="form-input" id="plan-name" placeholder="e.g. 4-Day Push/Pull Split" value="${esc(plan?.name||'')}" />
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea class="form-textarea" id="plan-desc" rows="3" placeholder="Describe your plan…">${esc(plan?.description||'')}</textarea>
    </div>
  </div>
  <div class="modal-footer">
    ${plan ? `<button class="btn-danger" onclick="App.deletePlanConfirm('${esc(planId)}')">Delete</button>` : '<div></div>'}
    <button class="btn-primary" onclick="App.savePlan('${esc(planId||'')}')">
      ${isNew ? 'Create Plan' : 'Save'}
    </button>
  </div>`;
}

/* ─────────────────────────────────────────────
   PROFILE EDITOR MODAL
───────────────────────────────────────────── */
function renderProfileModal() {
  const s = Settings.load();
  return `
  <div class="modal-header">
    <h3>Edit Profile</h3>
    <button class="modal-close" onclick="App.closeModal()">×</button>
  </div>
  <div class="form-body">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Weight (kg)</label>
        <input class="form-input" id="prof-weight" type="number" min="30" max="300" value="${s.weight}" />
      </div>
      <div class="form-group">
        <label class="form-label">Height (cm)</label>
        <input class="form-input" id="prof-height" type="number" min="100" max="250" value="${s.height}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Age</label>
      <input class="form-input" id="prof-age" type="number" min="10" max="100" value="${s.age}" />
    </div>
  </div>
  <div class="modal-footer">
    <button class="btn-secondary" onclick="App.closeModal()">Cancel</button>
    <button class="btn-primary" onclick="App.saveProfile()">Save</button>
  </div>`;
}

/* ─────────────────────────────────────────────
   ADD EXERCISE TO DAY MODAL
───────────────────────────────────────────── */
function renderAddExToDayModal(dayId) {
  const exercises = DB.getAllExercises();
  const day = DB.getDay(dayId);
  const existing = new Set(day?.exercises || []);

  return `
  <div class="modal-header">
    <h3>Add Exercise</h3>
    <button class="modal-close" onclick="App.closeModal()">×</button>
  </div>
  <div style="padding:10px 16px 0">
    <input class="search-input" type="search" placeholder="Search…" id="add-ex-search"
      oninput="App.filterAddExList(this.value,'${esc(dayId)}')" />
  </div>
  <div id="add-ex-list" style="max-height:60vh;overflow-y:auto">
    ${exercises.map(ex => `
      <div class="ex-list-item card-pressable" id="add-ex-${ex.id}"
        onclick="App.addExToDay('${esc(dayId)}','${esc(ex.id)}')"
        style="${existing.has(ex.id)?'opacity:0.4;pointer-events:none':''}">
        <div class="ex-info">
          <div class="ex-info-name">${esc(ex.name)}</div>
          <div class="ex-info-sub"><span>${(ex.muscleGroups||[]).join(', ')}</span></div>
        </div>
        ${existing.has(ex.id) ? '<span style="font-size:12px;color:var(--text-muted)">Added</span>' : '<button class="btn-outline" style="padding:6px 12px;font-size:12px">Add</button>'}
      </div>`).join('')}
  </div>
  <div class="modal-footer">
    <button class="btn-secondary" onclick="App.openExerciseEditor(null,'${esc(dayId)}')">+ Create New</button>
    <button class="btn-primary" onclick="App.closeModal()">Done</button>
  </div>`;
}

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
const App = {
  currentView: 'dashboard',

  init() {
    DB.load();
    Progress.load();
    Timer.init();
    this._setupNav();
    this._setupBackBtn();
    this._checkShareLink();
    this.renderView('dashboard');
    this._registerSW();
  },

  _registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/workout/sw.js').catch(() => {});
    }
  },

  _setupNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        Router.history = [];
        this.renderView(view);
      });
    });
  },

  _setupBackBtn() {
    document.getElementById('back-btn').addEventListener('click', () => Router.back());
  },

  _checkShareLink() {
    try {
      const hash = window.location.hash;
      if (hash.startsWith('#share=')) {
        const encoded = hash.slice(7);
        const json = decodeURIComponent(atob(encoded));
        DB.import(json);
        window.location.hash = '';
        this.toast('✅ Plan imported from link!', 'success');
      }
    } catch {}
  },

  renderView(view, params = {}) {
    this.currentView = view;
    const main = document.getElementById('app-main');
    const title = document.getElementById('page-title');
    const backBtn = document.getElementById('back-btn');
    const actionBtn = document.getElementById('header-action-btn');

    /* Update nav active state */
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.view === view);
    });

    /* Show/hide back button */
    const hasBack = Router.history.length > 0;
    backBtn.style.display = hasBack ? 'flex' : 'none';
    actionBtn.style.display = 'none';

    let html = '';
    switch (view) {
      case 'dashboard':
        title.textContent = 'Dashboard';
        html = renderDashboard();
        break;
      case 'week':
        title.textContent = 'Weekly Plan';
        html = renderWeek();
        break;
      case 'day':
        title.textContent = DB.getDay(params.dayId)?.name || 'Day';
        actionBtn.style.display = 'flex';
        actionBtn.onclick = () => this.openAddExToDay(params.dayId);
        html = renderDay(params);
        break;
      case 'exercise':
        title.textContent = DB.getExercise(params.exId)?.name || 'Exercise';
        html = renderExerciseDetail(params);
        break;
      case 'library':
        title.textContent = 'Exercise Library';
        html = renderLibrary();
        break;
      case 'plans':
        title.textContent = 'Plans';
        html = renderPlans();
        break;
      case 'settings':
        title.textContent = 'Settings';
        html = renderSettings();
        break;
      default:
        html = renderDashboard();
    }

    main.innerHTML = html;
    main.scrollTop = 0;

    /* Restore focus to search if library */
    if (view === 'library') {
      const s = document.getElementById('lib-search');
      if (s && libSearch) s.selectionStart = s.selectionEnd = libSearch.length;
    }
  },

  /* ── Exercise actions ── */
  openExerciseDetail(exId, dayId) {
    Router.navigate('exercise', { exId, dayId });
  },

  openExerciseEditor(exId, dayId) {
    this.closeModal();
    this.showModal(renderExerciseEditorModal(exId, dayId));
  },

  saveExercise(exId, dayId) {
    const name = document.getElementById('ex-name').value.trim();
    if (!name) { this.toast('Exercise name is required', 'error'); return; }

    const musclesSel = document.getElementById('ex-muscles');
    const muscles = Array.from(musclesSel.selectedOptions).map(o => o.value);

    const ex = {
      id: exId || null,
      name,
      category: document.getElementById('ex-category').value,
      muscleGroups: muscles,
      sets: parseInt(document.getElementById('ex-sets').value) || 3,
      reps: document.getElementById('ex-reps').value.trim(),
      duration: document.getElementById('ex-duration').value.trim(),
      rest: parseInt(document.getElementById('ex-rest').value) || 0,
      calories: parseInt(document.getElementById('ex-calories').value) || 0,
      instructions: document.getElementById('ex-instructions').value.trim(),
      imageUrl: document.getElementById('ex-image').value.trim(),
      videoUrl: document.getElementById('ex-video').value.trim(),
      notes: document.getElementById('ex-notes').value.trim(),
    };

    const saved = DB.saveExercise(ex);

    if (dayId && !exId) {
      /* Add to day */
      const day = DB.getDay(dayId);
      if (day && !day.exercises.includes(saved.id)) {
        day.exercises.push(saved.id);
        DB.saveDay(day);
      }
    }

    this.closeModal();
    this.toast(exId ? '✅ Exercise updated' : '✅ Exercise added', 'success');

    /* Re-render current view */
    if (this.currentView === 'exercise') {
      this.renderView('exercise', { exId: saved.id, dayId });
    } else if (this.currentView === 'day') {
      this.renderView('day', { dayId });
    } else if (this.currentView === 'library') {
      this.renderView('library');
    } else {
      this.renderView(this.currentView);
    }
  },

  removeExFromDay(dayId, exId) {
    if (!confirm('Remove this exercise from the day?')) return;
    const day = DB.getDay(dayId);
    if (!day) return;
    day.exercises = day.exercises.filter(id => id !== exId);
    DB.saveDay(day);
    Router.back();
    this.toast('Exercise removed from day');
  },

  removeExFromDayModal(dayId, exId) {
    const day = DB.getDay(dayId);
    if (!day) return;
    day.exercises = day.exercises.filter(id => id !== exId);
    DB.saveDay(day);
    this.showModal(renderDayEditorModal(dayId));
  },

  /* ── Set / progress ── */
  completeSet(dayId, exId, fromDetail = false) {
    const prog = Progress.completeSet(dayId, exId);
    const ex = DB.getExercise(exId);

    if (ex && ex.rest && !prog.done) {
      Timer.start(ex.rest);
    }
    if (prog.done) {
      this.toast('🎉 Workout complete! Great job!', 'success');
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
    } else {
      this.toast(`Set done! ${ex?.rest ? `Rest ${ex.rest}s` : ''}`, 'success');
    }

    if (fromDetail) {
      /* Re-render exercise detail */
      this.renderView('exercise', { exId, dayId });
    } else {
      this.renderView('dashboard');
    }
  },

  /* ── Day actions ── */
  editDay(dayId) {
    this.showModal(renderDayEditorModal(dayId));
  },

  saveDay(dayId) {
    const name = document.getElementById('day-name').value.trim();
    if (!name) { this.toast('Day name is required', 'error'); return; }

    const day = dayId ? DB.getDay(dayId) : null;
    const plan = DB.getActivePlan();

    const saved = DB.saveDay({
      id: dayId || null,
      name,
      type: document.getElementById('day-type').value,
      weekDayIndex: parseInt(document.getElementById('day-dow').value),
      notes: document.getElementById('day-notes').value.trim(),
      exercises: day?.exercises || [],
    });

    /* Add to plan if new */
    if (!dayId && plan && !plan.days.includes(saved.id)) {
      plan.days.push(saved.id);
      DB.savePlan(plan);
    }

    this.closeModal();
    this.toast(dayId ? '✅ Day updated' : '✅ Day created', 'success');
    this.renderView('plans');
  },

  deleteDayConfirm(dayId) {
    this.closeModal();
    if (!confirm('Delete this day? Exercises will not be deleted.')) return;
    /* Remove from plan */
    DB.getPlans().forEach(p => {
      if (p.days.includes(dayId)) {
        p.days = p.days.filter(id => id !== dayId);
        DB.savePlan(p);
      }
    });
    DB.deleteDay(dayId);
    this.toast('Day deleted');
    this.renderView('plans');
  },

  openAddExToDay(dayId) {
    this.showModal(renderAddExToDayModal(dayId));
  },

  addExToDay(dayId, exId) {
    const day = DB.getDay(dayId);
    if (!day) return;
    if (!day.exercises.includes(exId)) {
      day.exercises.push(exId);
      DB.saveDay(day);
      this.toast('Exercise added!', 'success');
    }
    this.closeModal();
    this.renderView('day', { dayId });
  },

  filterAddExList(query, dayId) {
    const q = query.toLowerCase();
    document.querySelectorAll('#add-ex-list .ex-list-item').forEach(el => {
      const name = el.querySelector('.ex-info-name')?.textContent.toLowerCase() || '';
      el.style.display = name.includes(q) ? '' : 'none';
    });
  },

  /* ── Plan actions ── */
  createNewPlan() {
    this.showModal(renderPlanEditorModal(null));
  },

  showPlanMenu(planId) {
    const plan = DB.getPlan(planId);
    if (!plan) return;
    const box = document.getElementById('modal-box');
    box.innerHTML = `
      <div class="modal-header">
        <h3>${esc(plan.name)}</h3>
        <button class="modal-close" onclick="App.closeModal()">×</button>
      </div>
      <div style="padding:8px 0">
        <div class="settings-row" onclick="App.showModal(renderPlanEditorModal('${esc(planId)}'))">
          <div class="settings-row-icon icon-blue">✏️</div>
          <div class="settings-row-text"><div class="settings-row-label">Edit Plan</div></div>
        </div>
        <div class="settings-row" onclick="App.addDayToPlan('${esc(planId)}')">
          <div class="settings-row-icon icon-green">➕</div>
          <div class="settings-row-text"><div class="settings-row-label">Add New Day</div></div>
        </div>
        <div class="settings-row" onclick="DB.setActivePlan('${esc(planId)}');App.closeModal();App.renderView('plans')">
          <div class="settings-row-icon icon-orange">⭐</div>
          <div class="settings-row-text"><div class="settings-row-label">Set as Active</div></div>
        </div>
        <div class="settings-row" onclick="App.deletePlanConfirm('${esc(planId)}')">
          <div class="settings-row-icon icon-red">🗑️</div>
          <div class="settings-row-text"><div class="settings-row-label text-danger">Delete Plan</div></div>
        </div>
      </div>`;
    document.getElementById('modal-overlay').classList.remove('hidden');
  },

  addDayToPlan(planId) {
    DB.setActivePlan(planId);
    this.closeModal();
    this.showModal(renderDayEditorModal(null));
  },

  savePlan(planId) {
    const name = document.getElementById('plan-name').value.trim();
    if (!name) { this.toast('Plan name is required', 'error'); return; }
    const plan = planId ? DB.getPlan(planId) : null;
    const saved = DB.savePlan({
      id: planId || null,
      name,
      description: document.getElementById('plan-desc').value.trim(),
      days: plan?.days || [],
    });
    if (!planId) DB.setActivePlan(saved.id);
    this.closeModal();
    this.toast(planId ? '✅ Plan updated' : '✅ Plan created', 'success');
    this.renderView('plans');
  },

  deletePlanConfirm(planId) {
    this.closeModal();
    if (!confirm('Delete this plan?')) return;
    DB.deletePlan(planId);
    this.toast('Plan deleted');
    this.renderView('plans');
  },

  /* ── Settings actions ── */
  editProfile() {
    this.showModal(renderProfileModal());
  },

  saveProfile() {
    const weight = parseInt(document.getElementById('prof-weight').value);
    const height = parseInt(document.getElementById('prof-height').value);
    const age = parseInt(document.getElementById('prof-age').value);
    if (!weight || !height || !age) { this.toast('Please fill all fields', 'error'); return; }
    Settings.save({ weight, height, age });
    this.closeModal();
    this.toast('✅ Profile saved', 'success');
    this.renderView('settings');
  },

  exportData() {
    const json = DB.export();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymtracker-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast('📤 Data exported!', 'success');
  },

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          DB.import(ev.target.result);
          this.toast('✅ Data imported successfully!', 'success');
          this.renderView('dashboard');
        } catch (err) {
          this.toast('❌ Invalid file format', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  shareViaLink() {
    try {
      const plan = DB.getActivePlan();
      if (!plan) { this.toast('No active plan to share', 'error'); return; }
      const exportObj = {
        version: 2,
        plans: { [plan.id]: plan },
        days: Object.fromEntries(DB.getDays(plan.days).map(d => [d.id, d])),
        exercises: {},
        activePlanId: plan.id
      };
      /* Include all exercises from the plan */
      DB.getDays(plan.days).forEach(d => {
        d.exercises.forEach(exId => {
          const ex = DB.getExercise(exId);
          if (ex) exportObj.exercises[exId] = ex;
        });
      });
      const json = JSON.stringify(exportObj);
      const encoded = btoa(encodeURIComponent(json));
      const url = `${window.location.origin}/workout/#share=${encoded}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => this.toast('🔗 Link copied!', 'success'));
      } else {
        prompt('Copy this link:', url);
      }
    } catch { this.toast('❌ Plan too large for URL sharing — use Export instead', 'error'); }
  },

  confirmReset() {
    if (!confirm('Reset ALL data? This will restore the default plan and cannot be undone.')) return;
    DB.reset();
    this.toast('✅ Data reset to defaults', 'success');
    this.renderView('dashboard');
  },

  /* ── Modal helpers ── */
  showModal(html) {
    const box = document.getElementById('modal-box');
    const overlay = document.getElementById('modal-overlay');
    box.innerHTML = html;
    overlay.classList.remove('hidden');
    /* Focus first input */
    setTimeout(() => {
      const inp = box.querySelector('input, textarea, select');
      if (inp) inp.focus();
    }, 100);
  },

  closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-box').innerHTML = '';
  },

  /* ── Toast ── */
  toast(msg, type = 'info') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast';
    if (type === 'success') el.style.background = '#2e7d32';
    else if (type === 'error') el.style.background = '#c62828';
    else if (type === 'warn') el.style.background = '#e65100';
    else el.style.background = '#323232';
    el.classList.remove('hidden');
    clearTimeout(App._toastTimer);
    App._toastTimer = setTimeout(() => {
      el.classList.add('fade-out');
      setTimeout(() => { el.classList.add('hidden'); el.classList.remove('fade-out'); }, 400);
    }, 2500);
  }
};

/* ── Close modal on overlay click ── */
document.getElementById('modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) App.closeModal();
});

/* ── Close rest timer on overlay click ── */
document.getElementById('rest-timer-overlay').addEventListener('click', function(e) {
  if (e.target === this) Timer.stop();
});

/* ── Keyboard shortcuts ── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    App.closeModal();
    Timer.stop();
  }
});

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => App.init());
