# RESTful API with 3rd Party Libraries

This project is a RESTful API built using modern web frameworks and libraries. It integrates with a database using an ORM tool and provides CRUD operations for resources. The API includes secure authentication, rate limiting, pagination, error handling, and comprehensive documentation. It also clones the functionality of the PokeAPI for the Pokemon resource, including tracking of caught and saved Pokemon by users.

## Features

- Built using a modern web framework
- Clearly defined routes and controllers
- Integration with a database using an ORM tool
- CRUD operations for resources
- Secure authentication (token-based or session-based)
- Rate limiting to prevent API abuse and ensure performance
- Pagination support for large datasets
- Proper error handling and informative error responses
- Comprehensive API documentation
- Cloned functionality of the PokeAPI for the Pokemon resource
- Tracking of caught and saved Pokemon by usersTo install 

## Installation
dependencies:
```sh
bun install
```

To run:
```sh
bun run dev
```

open http://localhost:3000 in the Postman

## Usage

Once the server is running, you can access the API endpoints using tools like Postman or cURL. The base URL for the API is `http://localhost:3000`.

### Authentication

To access protected routes, you need to include an authentication token in the request headers. To obtain a token, send a POST request to `/login` with the following payload:


The response will include a token that you can use for subsequent requests.

# API Endpoints Documentation

## POST /register

### Description
Registers a new user.

### Request Body
- `email`: User's email address.
- `password`: User's password.

### Response
- **Success**: `{ message: "User registered successfully" }`
- **Error (Duplicate Email)**: `{ message: "Email already exists" }`, Status: 409
- **Error (Internal Server Error)**: `{ message: "Internal Server Error" }`, Status: 500

## POST /login

### Description
Authenticates a user and generates a JWT token.

### Request Body
- `email`: User's email address.
- `password`: User's password.

### Response
- **Success**: `{ message: "Login successful", token: "..." }`
- **Error (User Not Found)**: `{ message: "User not found" }`, Status: 404
- **Error (Invalid Credentials)**: `{ message: "Invalid credentials" }`, Status: 401

## GET /pokemon/:name

### Description
Fetches Pokemon data from the PokeAPI.

### URL Parameter
- `name`: Name of the Pokemon.

### Response
- **Success**: `{ data: {... } }`
- **Error (Pokemon Not Found)**: `{ message: "Pokemon not found" }`, Status: 404

## POST /protected/capture (Protected Route)

### Description
Captures a Pokemon for the authenticated user.

### Request Body
- `name`: Name of the Pokemon to capture.

### Response
- **Success**: `{ message: "Pokemon caught successfully", data: {... } }`
- **Error (Unauthorized)**: `{ message: "Unauthorized" }`, Status: 401

## DELETE /protected/release/:id (Protected Route)

### Description
Releases a caught Pokemon for the authenticated user.

### URL Parameter
- `id`: ID of the CaughtPokemon record.

### Response
- **Success**: `{ message: "Pokemon released successfully" }`
- **Error (Unauthorized)**: `{ message: "Unauthorized" }`, Status: 401

## GET /protected/caught (Protected Route)

### Description
Retrieves all caught Pokemon for the authenticated user.

### Response
- **Success**: `{ data: [... ] }`
- **Error (Unauthorized)**: `{ message: "Unauthorized" }`, Status: 401

## Database

The API uses a database to store Pokemon and user data. The database schema and migrations are managed using an ORM tool.


