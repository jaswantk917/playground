<script lang="ts">
    import { onMount } from "svelte";
    import { Canvas } from "@threlte/core";
    import Scene from "./Scene.svelte";

    // --- CONFIGURATION STATE ---
    let carCount = $state(30);
    let maxSpeed = $state(5);
    let jitter = $state(0.1);

    // --- AUDIO SYSTEM ---
    let audioCtx: AudioContext;
    let crashBuffer: AudioBuffer;

    async function loadSound() {
        try {
            audioCtx = new AudioContext();
            // Ensure you have a file at static/sounds/crash.wav
            const res = await fetch("/sounds/crash.wav");
            if (!res.ok) throw new Error("Sound not found");
            const arr = await res.arrayBuffer();
            crashBuffer = await audioCtx.decodeAudioData(arr);
        } catch (e) {
            console.warn(
                "Audio setup failed (ignore if you lack the wav file):",
                e,
            );
        }
    }

    // This function is passed down to Scene.svelte
    function playCrash(intensity: number) {
        if (!crashBuffer || !audioCtx) return;

        // Resume context if browser suspended it (common in Chrome)
        if (audioCtx.state === "suspended") audioCtx.resume();

        const src = audioCtx.createBufferSource();
        const gain = audioCtx.createGain();

        src.buffer = crashBuffer;
        // Varry pitch slightly for realism
        src.playbackRate.value =
            (0.8 + intensity * 0.4) * (0.95 + Math.random() * 0.1);
        // Volume based on impact
        gain.gain.value = Math.min(intensity, 1) * 0.4;

        src.connect(gain).connect(audioCtx.destination);
        src.start();
    }

    onMount(() => {
        // Initialize audio on first user interaction to satisfy browser policies
        const initAudio = () => {
            loadSound();
            window.removeEventListener("click", initAudio);
            window.removeEventListener("keydown", initAudio);
        };
        window.addEventListener("click", initAudio);
        window.addEventListener("keydown", initAudio);
    });
</script>

<div class="container">
    <div class="game-layout">
        <div class="card controls">
            <h2>Traffic Sim 3D</h2>
            <p class="description">
                Adjust parameters to observe "Phantom Traffic Jams".
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
                    <span>Density: <strong>{carCount}</strong></span>
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
                        >Chaos (Jitter): <strong
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

            <div class="info">
                <small>Click anywhere to enable audio.</small>
            </div>
        </div>

        <div class="visualization-3d">
            <Canvas>
                <Scene {carCount} {maxSpeed} {jitter} {playCrash} />
            </Canvas>
        </div>
    </div>
</div>

<style>
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
        max-width: 1200px;
    }

    @media (min-width: 900px) {
        .game-layout {
            flex-direction: row;
            align-items: flex-start;
            justify-content: space-between;
        }
    }

    .card {
        background: rgba(0, 0, 0, 0.5);
        border-radius: 1rem;
        padding: 2rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        width: 100%;
        max-width: 350px;
        flex-shrink: 0;
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
    .info {
        margin-top: 1rem;
        color: #6b7280;
        font-style: italic;
        font-size: 0.8rem;
    }

    .visualization-3d {
        flex-grow: 1;
        height: 600px;
        width: 100%;
        /* CHANGE: New Paper Background Color */
        background: #f8f8f0;
        border-radius: 1rem;
        /* Lighter shadow for the paper look */
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        position: relative;
        /* Optional: Add a subtle paper texture pattern if you have one */
        /* background-image: url('/paper-noise.png'); */
    }
</style>
