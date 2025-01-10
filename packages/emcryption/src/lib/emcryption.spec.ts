import { emcryption } from './emcryption'; // Adjust the import path as necessary

// Mock crypto for Node.js environment if needed
if (typeof window === 'undefined') {
    const nodeCrypto = require('crypto');
    global.crypto = {
        getRandomValues: (buffer) => nodeCrypto.randomFillSync(buffer),
        subtle: nodeCrypto.webcrypto.subtle,
        randomUUID: () => `----`, // Mocked implementation
    };
}

describe('Emcryption', () => {
    const secretKey = 'testSecretKey123';
    const { encrypt, decrypt, toEmoji, fromEmoji } = emcryption(secretKey);

    test('encrypt and decrypt should return the original text', async () => {
        const originalText = 'Hello, World!';
        const encrypted = await encrypt(originalText);
        const decrypted = await decrypt(encrypted);
        expect(decrypted).toBe(originalText);
    });

    test('encrypt should produce different outputs for the same input', async () => {
        const text = 'Same input';
        const encrypted1 = await encrypt(text);
        const encrypted2 = await encrypt(text);
        expect(encrypted1).not.toBe(encrypted2);
    });

    test('decrypt should throw an error for invalid input', async () => {
        await expect(decrypt('invalid input')).rejects.toThrow();
    });

    test('toEmoji and fromEmoji should be inverse operations', () => {
        const testData = Buffer.from('Hello World').toString('base64');
        const emojified = toEmoji(testData);
        const restored = fromEmoji(emojified);
        console.log({ testData, emojified, restored });
        expect(restored).toEqual(testData);
    });

    test('encrypt and decrypt should work with empty string', async () => {
        const emptyString = '';
        const encrypted = await encrypt(emptyString);
        const decrypted = await decrypt(encrypted);
        expect(decrypted).toBe(emptyString);
    });

    test('encrypt and decrypt should work with long text', async () => {
        const longText = 'a'.repeat(1000);
        const encrypted = await encrypt(longText);
        const decrypted = await decrypt(encrypted);
        expect(decrypted).toBe(longText);
    });

    test('encrypt and decrypt should work with special characters', async () => {
        const specialChars = '!@#$%^&*()_+{}[]|:;<>,.?~`';
        const encrypted = await encrypt(specialChars);
        console.log({ specialChars, encrypted });
        const decrypted = await decrypt(encrypted);
        expect(decrypted).toBe(specialChars);
    });

    test('different secret keys should produce different encryptions', async () => {
        const text = 'Secret message';
        const { encrypt: encrypt1 } = emcryption('key1');
        const { encrypt: encrypt2 } = emcryption('key2');
        const encrypted1 = await encrypt1(text);
        const encrypted2 = await encrypt2(text);
        expect(encrypted1).not.toBe(encrypted2);
    });
});
