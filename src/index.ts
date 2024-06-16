import { Hono } from "hono";
import { cors } from "hono/cors";
import { PrismaClient, Prisma } from "@prisma/client";
import { HTTPException } from "hono/http-exception";
import { sign, verify } from "jsonwebtoken";
import axios from "axios";
import { jwt } from 'hono/jwt';
import type { JwtVariables } from 'hono/jwt';
import { rateLimiter } from "hono-rate-limiter";

type Variables = JwtVariables;

const app = new Hono<{ Variables: Variables }>();
const prisma = new PrismaClient();

// Enable CORS for all routes
app.use("/*", cors());

// Create a rate limiter middleware
const limiter = rateLimiter({
  windowMs: 2 * 60 * 1000, // 2 minutes
  limit: 3, // Limit each IP to 3 requests per `window` (here, per 2 minutes).
  keyGenerator: (c) => c.req.header("X-Forwarded-For") || "default",
});

// Apply the rate limiting middleware to all requests
app.use(limiter);

// Apply JWT authentication middleware to protected routes
app.use("/protected/*", jwt({ secret: 'myUniqueSecretKey' }));

// Authentication Endpoints
app.post("/register", async (c) => {
  const { email, password } = await c.req.json();
  
  // Hash the password using bcrypt with a higher cost for increased security
  const bcryptHash = await Bun.password.hash(password, { algorithm: "bcrypt", cost: 10 });
  
  try {
    // Create a new user in the database with the hashed password
    const user = await prisma.user.create({ data: { email, hashedPassword: bcryptHash } });
    return c.json({ message: `${user.email} registered successfully` });
  } catch (e) {
    // Handle duplicate email error
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return c.json({ message: "Email already exists" }, 409);
    }
    // Handle other errors
    throw new HTTPException(500, { message: "Internal Server Error" });
  }
});

app.post("/login", async (c) => {
  const { email, password } = await c.req.json();
  
  // Find the user by email and select only the necessary fields
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, hashedPassword: true } });
  
  if (!user) {
    return c.json({ message: "User not found" }, 404);
  }
  
  // Verify the provided password against the stored hashed password
  const match = await Bun.password.verify(password, user.hashedPassword, "bcrypt");
  
  if (!match) {
    throw new HTTPException(401, { message: "Invalid credentials" });
  }
  
  // Generate a JWT token with a 30-minute expiration time
  const payload = { sub: user.id, exp: Math.floor(Date.now() / 1000) + 30 * 60 };
  const token = sign(payload, "myUniqueSecretKey");
  
  return c.json({ message: "Login successful", token });
});

// Fetch Pokemon Data from PokeAPI
app.get("/pokemon/:name", async (c) => {
  const { name } = c.req.param();
  
  try {
    // Fetch Pokemon data from the PokeAPI
    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${name}`);
    return c.json({ data: response.data });
  } catch (error) {
    return c.json({ message: "Pokemon not found" }, 404);
  }
});

// Protected User Resource Endpoints
app.post("/protected/capture", async (c) => {
  const payload = c.get('jwtPayload');
  
  if (!payload) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  
  const { name: pokemonName } = await c.req.json();
  
  // Upsert the Pokemon in the database, creating it if it doesn't exist
  let pokemon = await prisma.pokemon.upsert({
    where: { name: pokemonName },
    update: {},
    create: { name: pokemonName }
  });
  
  // Create a new CaughtPokemon record associating the user with the caught Pokemon
  const caughtPokemon = await prisma.caughtPokemon.create({
    data: { userId: payload.sub, pokemonId: pokemon.id }
  });
  
  return c.json({ message: "Pokemon caught successfully", data: caughtPokemon });
});

app.delete("/protected/release/:id", async (c) => {
  const payload = c.get('jwtPayload');
  
  if (!payload) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  
  const { id } = c.req.param();
  
  // Delete the CaughtPokemon record for the specified ID and user
  await prisma.caughtPokemon.deleteMany({ where: { id, userId: payload.sub } });
  
  return c.json({ message: "Pokemon released successfully" });
});

app.get("/protected/caught", async (c) => {
  const payload = c.get('jwtPayload');
  
  if (!payload) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  
  // Find all CaughtPokemon records for the user, including the associated Pokemon data
  const caughtPokemon = await prisma.caughtPokemon.findMany({
    where: { userId: payload.sub },
    include: { pokemon: true }
  });
  
  return c.json({ data: caughtPokemon });
});

export default app;