<script lang="ts">
    import favicon from "$lib/assets/favicon.svg";

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
    :global(body) {
        font-family:
            system-ui,
            -apple-system,
            sans-serif;
        background: #111827;
        color: white;
        margin: 0;
        overflow-x: hidden;
    }
</style>
