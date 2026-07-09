/**
 * @swagger
 * /api/auth/sign-up:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user credential and database profile.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: User created and session cookies returned.
 *       400:
 *         description: Bad request (invalid credentials or email already taken).
 *
 * /api/auth/sign-in:
 *   post:
 *     summary: User Login
 *     description: Authenticates user credentials and sets HttpOnly session cookies.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Authenticated successfully.
 *       401:
 *         description: Unauthorized (incorrect email or password).
 *
 * /api/auth/sign-out:
 *   post:
 *     summary: User Logout
 *     description: Clears HttpOnly session cookies on the browser and terminates the active database session.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Session terminated successfully.
 */
export const betterAuthDocPlaceholder = true;
