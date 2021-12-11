#!/usr/bin/env node

import readline from 'readline';
import Redis from 'ioredis';
import winston from 'winston';

import {
  StorageHierarchy,
  MemoryStorageProvider,
  Logger,
  createAgingCache,
} from '@linkedmink/multilevel-aging-cache';
import {
  getStringKeyJsonValueOptions,
  RedisPubSubStorageProvider,
} from '@linkedmink/multilevel-aging-cache-ioredis';

Logger.options = {
  level: 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
};

const redisClient = new Redis(6379, 'localhost');

const redisChannel = new Redis(6379, 'localhost');

const storageHierarchy = new StorageHierarchy<string, Record<string, unknown>>([
  new MemoryStorageProvider(),
  new RedisPubSubStorageProvider(redisClient, getStringKeyJsonValueOptions(), redisChannel),
]);

const cache = createAgingCache<string, Record<string, unknown>>(storageHierarchy);

const cliReadline = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const PROMPT_COMMAND = 'Enter a command to read/write cache: ';
const PROMPT_KEY = 'Enter the key: ';
const PROMPT_VALUE = 'Enter the value: ';

const promptInput = (prompt: string): Promise<string> => {
  return new Promise<string>(resolve =>
    cliReadline.question(prompt, ans => {
      resolve(ans);
    })
  );
};

const main = async (): Promise<number> => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const command = (await promptInput(PROMPT_COMMAND)).toLowerCase();
    if (command === 'get') {
      const key = await promptInput(PROMPT_KEY);
      const data = await cache.get(key, false);
      console.log(data);
    } else if (command === 'set') {
      const key = await promptInput(PROMPT_KEY);
      const value = JSON.parse(await promptInput(PROMPT_VALUE)) as Record<string, unknown>;
      const status = await cache.set(key, value, false);
      console.log(status);
    } else if (command === 'delete') {
      const key = await promptInput(PROMPT_KEY);
      const status = await cache.delete(key, false);
      console.log(status);
    } else if (command === 'keys') {
      const keys = await cache.keys();
      console.log(keys);
    } else if (command === 'exit') {
      return 0;
    } else {
      console.error('Invalid Command');
    }
  }
};

main()
  .then(code => process.exit(code))
  .catch(error => process.exit(1));
