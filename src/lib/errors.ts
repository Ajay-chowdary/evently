/**
 * Thrown by image-upload helpers so callers can surface a clean error to the
 * user instead of silently writing a base64 data URL into Postgres.
 */
export class ImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageUploadError";
  }
}
