
const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

// 1. Load .env from the project root.
// __dirname = src/config
// ../../.env = project-root/.env
dotenv.config({
    path: path.resolve(__dirname, '../../.env'),
});

// 2. Define the environment variable schema.
const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),

    PORT: z.coerce
        .number()
        .int()
        .min(1)
        .max(65535)
        .default(5000),

    DB_HOST: z.string().trim().min(1).default('localhost'),

    DB_PORT: z.coerce
        .number()
        .int()
        .min(1)
        .max(65535)
        .default(3306),

    DB_USER: z.string().trim().min(1).default('root'),

    DB_PASSWORD: z.string().default(''),

    DB_NAME: z.string().trim().min(1).default('cims_db'),

    JWT_SECRET: z
        .string()
        .min(32, 'JWT_SECRET must contain at least 32 characters'),

    JWT_EXPIRES_IN: z.string().trim().min(1).default('2h'),
}).strict();

// 3. Pick only the variables used by this application.
const rawEnv = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
};

// 4. Validate and normalize the environment.
const parsedEnv = envSchema.safeParse(rawEnv);

if (!parsedEnv.success) {
    const errorDetails = parsedEnv.error.issues
        .map((issue) => {
            const field = issue.path.join('.');
            return `- ${field}: ${issue.message}`;
        })
        .join('\n');

    throw new Error(
        `Invalid environment configuration:\n${errorDetails}`
    );
}

// 5. Export a structured configuration object.
const env = {
    nodeEnv: parsedEnv.data.NODE_ENV,
    port: parsedEnv.data.PORT,

    db: {
        host: parsedEnv.data.DB_HOST,
        port: parsedEnv.data.DB_PORT,
        user: parsedEnv.data.DB_USER,
        password: parsedEnv.data.DB_PASSWORD,
        database: parsedEnv.data.DB_NAME,
    },

    jwt: {
        secret: parsedEnv.data.JWT_SECRET,
        expiresIn: parsedEnv.data.JWT_EXPIRES_IN,
    },
};

module.exports = env;
