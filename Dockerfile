# --- Stage 1: Build the app ---
# We use Node to build because Svelte's build tools work best here.
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
# Install all dependencies
RUN npm ci
COPY . .
# Build the app (creates the 'build' folder)
RUN npm run build
# Remove unneeded dev tools to keep the image small
RUN npm prune --production

# --- Stage 2: Run with Deno ---
# Now we switch to Deno to actually run the server.
FROM denoland/deno:alpine

WORKDIR /app

# Copy the built files and production dependencies from Stage 1
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose port 3000 (standard for Svelte)
EXPOSE 3000

# Run the app using Deno with full permissions (-A)
# We run the index.js file that the adapter created
CMD ["run", "-A", "build/index.js"]
