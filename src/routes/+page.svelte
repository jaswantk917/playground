<script lang="ts">
    import { onMount } from "svelte";
    import { taskStore } from "$lib/stores/taskStore";

    // Load tasks on mount
    onMount(() => {
        taskStore.loadTasks();
    });

    let newTaskTitle = "";

    const handleSubmit = () => {
        if (!newTaskTitle.trim()) return;
        taskStore.addTask(newTaskTitle);
        newTaskTitle = "";
    };
</script>

<div class="max-w-xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-xl">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">My Tasks</h1>

    <form on:submit|preventDefault={handleSubmit} class="flex gap-3 mb-8">
        <input
            type="text"
            bind:value={newTaskTitle}
            placeholder="What needs to be done?"
            class="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={$taskStore.loading}
        />
        <button
            type="submit"
            disabled={!newTaskTitle.trim() || $taskStore.loading}
            class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
            Add
        </button>
    </form>

    {#if $taskStore.loading && $taskStore.tasks.length === 0}
        <div class="text-center py-4 text-gray-500">Loading tasks...</div>
    {:else if $taskStore.error}
        <div class="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
            Error: {$taskStore.error}
        </div>
    {/if}

    <ul class="space-y-3">
        {#each $taskStore.tasks as task (task.id)}
            <li
                class="flex items-center justify-between p-4 bg-gray-50 rounded-lg group hover:shadow-sm transition"
            >
                <label
                    class="flex items-center gap-3 cursor-pointer select-none"
                >
                    <input
                        type="checkbox"
                        checked={task.isCompleted}
                        on:change={() =>
                            taskStore.toggleTask(task.id, task.isCompleted)}
                        class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span
                        class:line-through={task.isCompleted}
                        class:text-gray-400={task.isCompleted}
                        class="text-gray-700 text-lg"
                    >
                        {task.title}
                    </span>
                </label>

                <button
                    on:click={() => taskStore.deleteTask(task.id)}
                    class="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition px-2"
                    aria-label="Delete task"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </button>
            </li>
        {/each}
    </ul>

    {#if $taskStore.tasks.length === 0 && !$taskStore.loading}
        <p class="text-center text-gray-400 mt-8">
            No tasks yet. Add one above!
        </p>
    {/if}
</div>
