declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      DATABASE_URL: string;
      JWT_SECRET: string;
    }
  }
  namespace Express {
    export interface Request {
      userId: string;
    }
  }
}

export {};
