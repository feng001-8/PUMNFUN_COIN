import { FastifyInstance } from 'fastify';
import { TwitterAPIService } from '../services/twitter-api.js';
export declare function twitterRoutes(fastify: FastifyInstance, twitterService: TwitterAPIService | null): Promise<void>;
