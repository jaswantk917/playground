<script lang="ts">
    import { onMount } from "svelte";
    let audioCtx: AudioContext;
    let crashBuffer: AudioBuffer;

    async function loadSound() {
        audioCtx = new AudioContext();
        const res = await fetch("/sounds/crash.wav"); // short, bassy
        const arr = await res.arrayBuffer();
        crashBuffer = await audioCtx.decodeAudioData(arr);
    }

    // --- 1. CONFIGURATION (Reactive State via Runes) ---
    let carCount = $state(30);
    let maxSpeed = $state(5); // Target cruising speed
    let jitter = $state(0.1); // Probability of random braking (0 to 1)
    let simulationRunning = $state(false);

    // Constants
    const TRACK_RADIUS = 200;
    const TRACK_LENGTH = 2 * Math.PI * TRACK_RADIUS;
    const CAR_LENGTH = 15; // Visual size + buffer

    // --- 2. GAME STATE ---
    // In Svelte 5, $state() creates a deeply reactive proxy.
    // We can mutate properties inside this array freely.
    let cars: { id: number; pos: number; vel: number; color: string }[] =
        $state([]);

    function initCars() {
        // Create cars evenly spaced
        cars = Array.from({ length: carCount }, (_, i) => ({
            id: i,
            // Position on the track (0 to TRACK_LENGTH)
            pos: (TRACK_LENGTH / carCount) * i,
            // Current velocity
            vel: 0,
            // Visual color (computed during update)
            color: "lime",
        }));
    }

    // --- 3. PHYSICS ENGINE ---
    function update() {
        if (!simulationRunning) return;

        // We iterate through all cars
        for (let i = 0; i < cars.length; i++) {
            let car = cars[i];

            // Identify the car in front (handle array wrapping)
            let nextCarIndex = (i + 1) % cars.length;
            let nextCar = cars[nextCarIndex];

            // Calculate distance to car in front (handling loop wrap-around)
            let distance =
                (nextCar.pos - car.pos + TRACK_LENGTH) % TRACK_LENGTH;

            // --- PHYSICS LOGIC ---

            // 1. Acceleration (Cruise Control)
            if (car.vel < maxSpeed) {
                car.vel += 0.05;
            }

            // 2. Braking (Collision Avoidance)
            // If we are getting too close relative to our speed
            if (distance < CAR_LENGTH + car.vel * 3) {
                car.vel *= 0.9; // Smooth braking
            }
            // Emergency stop prevents overlap
            if (distance < CAR_LENGTH) {
                const impact = Math.min(car.vel / maxSpeed, 1);

                playCrash(impact);

                car.vel = 0;
                car.pos -= 0.5; // Slight bounce back to separate
            }

            // 3. The "Phantom Jam" Factor (Random Noise)
            // Randomly tap brakes if we are moving fast enough
            if (car.vel > 1 && Math.random() < jitter) {
                car.vel *= 0.8;
            }

            // 4. Update Position
            car.pos = (car.pos + car.vel) % TRACK_LENGTH;

            // 5. Update Color for Visualization
            // Red = Stopped, Yellow = Slow, Green = Fast
            if (car.vel < 0.5)
                car.color = "#ff3e3e"; // Red
            else if (car.vel < maxSpeed * 0.5)
                car.color = "#ffc800"; // Orange
            else car.color = "#4ade80"; // Green
        }

        requestAnimationFrame(update);
    }
    function playCrash(intensity: number) {
        if (!crashBuffer) return;

        const src = audioCtx.createBufferSource();
        const gain = audioCtx.createGain();
        const delay = audioCtx.createDelay();

        src.buffer = crashBuffer;

        // pitch = impact + tiny randomness (prevents repetition fatigue)
        src.playbackRate.value =
            (0.8 + intensity * 0.4) * (0.95 + Math.random() * 0.1);

        // loudness = impact strength
        gain.gain.value = Math.min(intensity, 1);

        // micro echo (physical "clack")
        delay.delayTime.value = 0.03;

        // audio graph
        src.connect(gain).connect(delay).connect(audioCtx.destination);

        src.start();
    }

    // --- 4. LIFECYCLE ---
    onMount(() => {
        initCars();
        loadSound();
        simulationRunning = true;
        requestAnimationFrame(update);

        return () => {
            simulationRunning = false;
        };
    });

    // Re-init cars if the count changes
    // We use $effect to track the `carCount` dependency
    $effect(() => {
        // Only re-init if the array length doesn't match the slider
        if (cars.length !== carCount) {
            initCars();
        }
    });
</script>

<div class="container">
    <div class="game-layout">
        <div class="card controls">
            <h2>Traffic Simulator</h2>
            <p class="description">
                Adjust the sliders to see how "Phantom Jams" form without any
                accidents.
            </p>

            <div class="control-group">
                <label>
                    <span>Max Speed: <strong>{maxSpeed}</strong></span>
                    <input
                        type="range"
                        min="2"
                        max="10"
                        step="0.1"
                        bind:value={maxSpeed}
                    />
                </label>
            </div>

            <div class="control-group">
                <label>
                    <span>Density (Cars): <strong>{carCount}</strong></span>
                    <input
                        type="range"
                        min="10"
                        max="60"
                        bind:value={carCount}
                    />
                </label>
            </div>

            <div class="control-group">
                <label>
                    <span
                        >Human Error (Jitter): <strong
                            >{(jitter * 100).toFixed(0)}%</strong
                        ></span
                    >
                    <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.01"
                        bind:value={jitter}
                    />
                    <small class="hint"
                        >Higher jitter = more random braking</small
                    >
                </label>
            </div>

            <button class="reset-btn" onclick={initCars}
                >Reset Simulation</button
            >
        </div>

        <div class="visualization">
            <svg viewBox="0 0 500 500" class="track-svg">
                <circle
                    cx="250"
                    cy="250"
                    r={TRACK_RADIUS}
                    stroke="#1f2937"
                    stroke-width="40"
                    fill="none"
                />
                <circle
                    cx="250"
                    cy="250"
                    r={TRACK_RADIUS}
                    stroke="#374151"
                    stroke-width="38"
                    fill="none"
                    stroke-dasharray="10 20"
                />

                {#each cars as car (car.id)}<g
                        transform="rotate({(car.pos / TRACK_LENGTH) *
                            360} 250 250)"
                    >
                        <!-- car -->
                        <g
                            transform="translate({250 - 12} {250 -
                                TRACK_RADIUS -
                                10})"
                        >
                            <!-- body -->
                            <rect
                                x="0"
                                y="0"
                                width="24"
                                height="16"
                                rx="4"
                                fill={car.color}
                                stroke="rgba(0,0,0,0.3)"
                                stroke-width="1"
                            />

                            <!-- windshield -->
                            <rect
                                x="4"
                                y="2"
                                width="16"
                                height="4"
                                rx="2"
                                fill="rgba(255,255,255,0.5)"
                            />

                            <!-- rear window -->
                            <rect
                                x="6"
                                y="10"
                                width="12"
                                height="3"
                                rx="1.5"
                                fill="rgba(0,0,0,0.2)"
                            />

                            <!-- wheels -->
                            <rect
                                x="-2"
                                y="3"
                                width="2"
                                height="4"
                                rx="1"
                                fill="#222"
                            />
                            <rect
                                x="-2"
                                y="9"
                                width="2"
                                height="4"
                                rx="1"
                                fill="#222"
                            />
                            <rect
                                x="24"
                                y="3"
                                width="2"
                                height="4"
                                rx="1"
                                fill="#222"
                            />
                            <rect
                                x="24"
                                y="9"
                                width="2"
                                height="4"
                                rx="1"
                                fill="#222"
                            />
                        </g>
                    </g>
                {/each}
            </svg>
        </div>
    </div>
</div>

<style>
    :global(body) {
        font-family: system-ui, sans-serif;
        background: #111827;
        color: white;
        margin: 0;
    }

    .container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 20px;
    }

    .game-layout {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 40px;
        width: 100%;
        max-width: 1000px;
    }

    @media (min-width: 768px) {
        .game-layout {
            flex-direction: row;
            justify-content: space-around;
        }
    }

    .card {
        background: #1f2937;
        padding: 2rem;
        border-radius: 1rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        width: 100%;
        max-width: 350px;
    }

    h2 {
        margin-top: 0;
        color: #4ade80;
    }
    .description {
        color: #9ca3af;
        font-size: 0.9rem;
        margin-bottom: 2rem;
    }

    .control-group {
        margin-bottom: 1.5rem;
    }
    label {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    input[type="range"] {
        width: 100%;
        accent-color: #4ade80;
    }
    .hint {
        color: #6b7280;
        font-size: 0.75rem;
    }

    .reset-btn {
        width: 100%;
        padding: 10px;
        background: #4ade80;
        border: none;
        border-radius: 6px;
        color: #064e3b;
        font-weight: bold;
        cursor: pointer;
        transition: background 0.2s;
    }
    .reset-btn:hover {
        background: #22c55e;
    }

    .visualization {
        flex-grow: 1;
        display: flex;
        justify-content: center;
    }

    .track-svg {
        width: 100%;
        max-width: 600px;
        height: auto;
        filter: drop-shadow(0 0 20px rgba(74, 222, 128, 0.1));
    }
</style>
