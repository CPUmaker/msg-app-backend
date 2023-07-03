declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      DATABASE_URL: string;
      JWT_SECRET: string;
      CA_KEY: string;
      CA_CERT: string;
    }
  }
  namespace Express {
    export interface Request {
      userId: string;
    }
  }
}

export {};
