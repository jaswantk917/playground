<script lang="ts">
    import { T, useTask } from "@threlte/core";
    import { OrbitControls, Outlines } from "@threlte/extras";
    import { DoubleSide } from "three";

    // 1. Props
    let { carCount, maxSpeed, jitter, playCrash } = $props();

    // Constants
    const TRACK_RADIUS = 200;
    const TRACK_LENGTH = 2 * Math.PI * TRACK_RADIUS;
    const CAR_LENGTH = 15;

    // 2. State
    let cars = $state<
        { id: number; pos: number; vel: number; color: string }[]
    >([]);

    function initCars() {
        cars = Array.from({ length: carCount }, (_, i) => ({
            id: i,
            pos: (TRACK_LENGTH / carCount) * i,
            vel: 0,
            // Use slightly desaturated, pencil-like colors
            color: "#6ee7b7",
        }));
    }

    $effect(() => {
        if (cars.length !== carCount) initCars();
    });

    // 3. Physics Loop (Unchanged)
    useTask(() => {
        for (let i = 0; i < cars.length; i++) {
            let car = cars[i];
            let nextCar = cars[(i + 1) % cars.length];
            let distance =
                (nextCar.pos - car.pos + TRACK_LENGTH) % TRACK_LENGTH;

            if (car.vel < maxSpeed) car.vel += 0.05;
            if (distance < CAR_LENGTH + car.vel * 3) car.vel *= 0.9;
            if (distance < CAR_LENGTH) {
                const impact = Math.min(car.vel / maxSpeed, 1);
                if (impact > 0.1) playCrash(impact);
                car.vel = 0;
                car.pos -= 1.0;
            }
            if (car.vel > 1 && Math.random() < jitter) car.vel *= 0.8;
            car.pos = (car.pos + car.vel) % TRACK_LENGTH;

            // Update Color (Pencil colors)
            if (car.vel < 0.5)
                car.color = "#f87171"; // Red pencil
            else if (car.vel < maxSpeed * 0.5)
                car.color = "#fbbf24"; // Yellow pencil
            else car.color = "#6ee7b7"; // Green pencil
        }
    });

    // 4. Transform Logic (Unchanged)
    function getCarTransform(pos: number) {
        const getPos = (p: number) => {
            const angle = (p / TRACK_LENGTH) * 2 * Math.PI;
            return {
                x: Math.cos(-angle) * TRACK_RADIUS,
                z: Math.sin(-angle) * TRACK_RADIUS,
            };
        };
        const current = getPos(pos);
        const next = getPos(pos + 0.1);
        const rotY = Math.atan2(next.x - current.x, next.z - current.z);
        return { x: current.x, z: current.z, rotY };
    }
</script>

<T.PerspectiveCamera makeDefault position={[0, 450, 450]} fov={50}>
    <OrbitControls enableZoom={true} />
</T.PerspectiveCamera>

<T.AmbientLight intensity={1.5} />

<T.Mesh rotation.x={-Math.PI / 2}>
    <T.RingGeometry args={[TRACK_RADIUS - 25, TRACK_RADIUS + 25, 64]} />
    <T.MeshBasicMaterial color="#e5e7eb" side={DoubleSide} />
    <Outlines thickness={6} color="#222" />
</T.Mesh>

{#each cars as car (car.id)}
    {@const transform = getCarTransform(car.pos)}

    <T.Group
        position={[transform.x, 2, transform.z]}
        rotation.y={transform.rotY}
    >
        <T.Mesh position.y={4}>
            <T.BoxGeometry args={[12, 8, 24]} />
            <T.MeshBasicMaterial color={car.color} />
            <Outlines thickness={0.08} color="#222" screenspace={false} />
        </T.Mesh>

        {#each [[6, 2, 8], [-6, 2, 8], [6, 2, -8], [-6, 2, -8]] as pos}
            <T.Mesh rotation.z={Math.PI / 2} position={pos}>
                <T.CylinderGeometry args={[3, 3, 4]} />
                <T.MeshBasicMaterial color="#333" />
            </T.Mesh>
        {/each}
    </T.Group>
{/each}
