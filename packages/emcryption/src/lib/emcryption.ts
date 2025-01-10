const emojiSet = [
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '😂',
    '🤣',
    '😊',
    '😇',
    '🙂',
    '🙃',
    '😉',
    '😌',
    '😍',
    '🥰',
    '😘',
    '😗',
    '😙',
    '😚',
    '😋',
    '😛',
    '😜',
    '🤪',
    '😝',
    '🤑',
    '🤗',
    '🤭',
    '🤫',
    '🤔',
    '🤐',
    '🤨',
    '😐',
    '😑',
    '😶',
    '😏',
    '😒',
    '🙄',
    '😬',
    '🤥',
    '😌',
    '😔',
    '😪',
    '🤤',
    '😴',
    '😷',
    '🤒',
    '🤕',
    '🤢',
    '🤮',
    '🤧',
    '🥵',
    '🥶',
    '🥴',
    '😵',
    '🤯',
    '🤠',
    '🥳',
    '😎',
    '🤓',
    '🧐',
    '😕',
    '😟',
    '🙁',
];

const base64Chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const base64ToEmoji: { [key: string]: string } = {};
const emojiToBase64: { [key: string]: string } = {};

for (let i = 0; i < 64; i++) {
    base64ToEmoji[base64Chars[i]] = emojiSet[i];
    emojiToBase64[emojiSet[i]] = base64Chars[i];
}

base64ToEmoji['='] = '😎';
emojiToBase64['😎'] = '=';

// Define a crypto interface that works in both Node.js and browser environments
interface ICrypto {
    getRandomValues(array: Uint8Array): Uint8Array;
    subtle: {
        importKey(
            format: string,
            keyData: ArrayBuffer,
            algorithm: { name: string },
            extractable: boolean,
            keyUsages: string[]
        ): Promise<CryptoKey>;
        encrypt(
            algorithm: { name: string; iv: Uint8Array },
            key: CryptoKey,
            data: ArrayBuffer
        ): Promise<ArrayBuffer>;
        decrypt(
            algorithm: { name: string; iv: Uint8Array },
            key: CryptoKey,
            data: ArrayBuffer
        ): Promise<ArrayBuffer>;
        deriveKey(
            algorithm: {
                name: string;
                salt: Uint8Array;
                iterations: number;
                hash: string;
            },
            baseKey: CryptoKey,
            derivedKeyAlgorithm: { name: string; length: number },
            extractable: boolean,
            keyUsages: string[]
        ): Promise<CryptoKey>;
        deriveBits(
            algorithm: {
                name: string;
                salt: Uint8Array;
                iterations: number;
                hash: string;
            },
            baseKey: CryptoKey,
            length: number
        ): Promise<ArrayBuffer>;
    };
}

// Use the appropriate crypto implementation
const cryptoImpl: ICrypto =
    typeof window !== 'undefined' ? window.crypto : require('crypto').webcrypto;

export function emcryption(secretKey: string) {
    async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
        const encoder = new TextEncoder();
        const keyMaterial = await cryptoImpl.subtle.importKey(
            'raw',
            encoder.encode(secretKey),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );

        return cryptoImpl.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256',
            },
            keyMaterial,
            { name: 'AES-CBC', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    function toEmoji(base64: string): string {
        return base64
            .split('')
            .map((char) => base64ToEmoji[char] || char)
            .join('');
    }

    function fromEmoji(emojiString: string): string {
        const b64: Array<string> = [];
        const length = [...emojiString].length;
        for (let i = 0; i < length * 2; ) {
            const currentStep = String.fromCodePoint(
                emojiString.codePointAt(i)!
            );
            b64.push(emojiToBase64[currentStep]);
            i = i + currentStep.length;
        }
        return b64.join('');
    }

    async function encrypt(text: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const iv = cryptoImpl.getRandomValues(new Uint8Array(16));
        const salt = cryptoImpl.getRandomValues(new Uint8Array(16));
        const key = await deriveKey(salt);

        const encrypted = await cryptoImpl.subtle.encrypt(
            { name: 'AES-CBC', iv: iv },
            key,
            data
        );

        const result = new Uint8Array(
            salt.length + iv.length + encrypted.byteLength
        );
        result.set(salt, 0);
        result.set(iv, salt.length);
        result.set(new Uint8Array(encrypted), salt.length + iv.length);

        // Convert to base64 first
        const base64 = btoa(String.fromCharCode.apply(null, [...result]));
        return toEmoji(base64);
    }

    async function decrypt(emojiText: string): Promise<string> {
        const base64 = fromEmoji(emojiText);
        const data = new Uint8Array(
            atob(base64)
                .split('')
                .map((char) => char.charCodeAt(0))
        );

        const salt = data.slice(0, 16);
        const iv = data.slice(16, 32);
        const encrypted = data.slice(32);
        const key = await deriveKey(salt);

        try {
            const decrypted = await cryptoImpl.subtle.decrypt(
                { name: 'AES-CBC', iv: iv },
                key,
                encrypted
            );

            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('Decryption failed:', error);
            throw error;
        }
    }

    return {
        encrypt,
        decrypt,
        fromEmoji,
        toEmoji,
    };
}
