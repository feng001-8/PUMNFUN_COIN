import { FastifyInstance } from 'fastify';
import { DatabaseManager } from '../database/schema.js';
import { TwitterAPIService } from '../services/twitter-api.js';
export declare function registerRoutes(fastify: FastifyInstance, db: DatabaseManager, twitterService?: TwitterAPIService | null): Promise<void>;
