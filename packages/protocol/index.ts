// Binary Protocol Definitions for WebSocket Communication

/**
 * Message Types for binary protocol
 * Using single byte identifiers for efficiency
 */
export enum BinaryMessageType {
  // Terminal stream (0x01-0x0F)
  TERMINAL_STDOUT = 0x01,
  TERMINAL_STDIN = 0x02,
  TERMINAL_RESIZE = 0x03,
  TERMINAL_SIGNAL = 0x04,
  
  // SFTP operations (0x10-0x2F)
  SFTP_READ_DIR = 0x10,
  SFTP_READ_DIR_RESPONSE = 0x11,
  SFTP_OPEN_FILE = 0x12,
  SFTP_OPEN_FILE_RESPONSE = 0x13,
  SFTP_READ_FILE = 0x14,
  SFTP_READ_FILE_CHUNK = 0x15,
  SFTP_WRITE_FILE = 0x16,
  SFTP_WRITE_FILE_ACK = 0x17,
  SFTP_CLOSE_FILE = 0x18,
  SFTP_DELETE = 0x19,
  SFTP_RENAME = 0x1A,
  SFTP_MKDIR = 0x1B,
  SFTP_CHMOD = 0x1C,
  SFTP_STAT = 0x1D,
  SFTP_STAT_RESPONSE = 0x1E,
  
  // Control messages (0xF0-0xFF)
  PING = 0xF0,
  PONG = 0xF1,
  ERROR = 0xF2,
  CLOSE = 0xF3,
}

/**
 * Header structure for binary messages:
 * [type: 1 byte][flags: 1 byte][length: 2 bytes][sessionId: 16 bytes][payload: variable]
 * Total header: 20 bytes
 */
export const HEADER_SIZE = 20;
export const SESSION_ID_SIZE = 16;

export interface BinaryMessageHeader {
  type: BinaryMessageType;
  flags: number;
  length: number;
  sessionId: string;
}

/**
 * Encode a binary message header
 */
export function encodeHeader(header: BinaryMessageHeader): ArrayBuffer {
  const buffer = new ArrayBuffer(HEADER_SIZE);
  const view = new DataView(buffer);
  
  view.setUint8(0, header.type);
  view.setUint8(1, header.flags);
  view.setUint16(2, header.length, true); // little-endian
  
  // Session ID (16 bytes)
  const sessionIdBytes = new TextEncoder().encode(header.sessionId.padEnd(16, '\0').substring(0, 16));
  for (let i = 0; i < 16; i++) {
    view.setUint8(4 + i, sessionIdBytes[i] || 0);
  }
  
  return buffer;
}

/**
 * Decode a binary message header
 */
export function decodeHeader(buffer: ArrayBuffer): BinaryMessageHeader {
  const view = new DataView(buffer);
  
  const type = view.getUint8(0);
  const flags = view.getUint8(1);
  const length = view.getUint16(2, true);
  
  const sessionIdBytes = new Uint8Array(buffer, 4, 16);
  const sessionId = new TextDecoder().decode(sessionIdBytes).replace(/\0/g, '');
  
  return { type, flags, length, sessionId };
}

/**
 * Create a complete binary message
 */
export function createBinaryMessage(
  type: BinaryMessageType,
  payload: ArrayBuffer | Uint8Array,
  sessionId: string,
  flags: number = 0
): ArrayBuffer {
  const header = encodeHeader({
    type,
    flags,
    length: payload.byteLength,
    sessionId,
  });
  
  const totalSize = HEADER_SIZE + payload.byteLength;
  const message = new Uint8Array(totalSize);
  message.set(new Uint8Array(header), 0);
  message.set(new Uint8Array(payload), HEADER_SIZE);
  
  return message.buffer;
}

/**
 * Parse incoming binary data into messages
 * Handles multiple messages in a single chunk
 */
export function parseBinaryMessages(data: ArrayBuffer): Array<{
  header: BinaryMessageHeader;
  payload: Uint8Array;
}> {
  const messages: Array<{ header: BinaryMessageHeader; payload: Uint8Array }> = [];
  let offset = 0;
  const view = new DataView(data);
  
  while (offset < data.byteLength) {
    if (offset + HEADER_SIZE > data.byteLength) {
      break; // Incomplete header
    }
    
    const headerBuffer = data.slice(offset, offset + HEADER_SIZE);
    const header = decodeHeader(headerBuffer);
    
    if (offset + HEADER_SIZE + header.length > data.byteLength) {
      break; // Incomplete payload
    }
    
    const payload = new Uint8Array(data, offset + HEADER_SIZE, header.length);
    messages.push({ header, payload });
    
    offset += HEADER_SIZE + header.length;
  }
  
  return messages;
}

/**
 * Compression flags
 */
export const CompressionFlags = {
  NONE: 0x00,
  GZIP: 0x01,
  DEFLATE: 0x02,
  BROTLI: 0x03,
};

/**
 * Error codes
 */
export enum ErrorCode {
  SUCCESS = 0,
  GENERAL_ERROR = 1,
  CONNECTION_FAILED = 2,
  AUTHENTICATION_FAILED = 3,
  PERMISSION_DENIED = 4,
  FILE_NOT_FOUND = 5,
  FILE_ALREADY_EXISTS = 6,
  DISK_FULL = 7,
  TIMEOUT = 8,
  PROTOCOL_ERROR = 9,
  SESSION_EXPIRED = 10,
}

/**
 * Terminal signal types
 */
export enum TerminalSignal {
  HUP = 'HUP',
  INT = 'INT',
  QUIT = 'QUIT',
  KILL = 'KILL',
  TERM = 'TERM',
  USR1 = 'USR1',
  USR2 = 'USR2',
  WINCH = 'WINCH',
}
