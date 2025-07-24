/**
 * Interface describing the structure of base64 data extracted from a Data URL.
 */
export interface IBase64Data {
  /** The MIME type of the file (e.g., "image/png", "application/json") */
  mimeType: string;
  /** The filename without extension */
  filename: string;
  /** The file extension (e.g., "png", "json") */
  extension: string;
  /** The base64-encoded file data (without metadata) */
  b64data: string;
}

/**
 * Converts a base64 string into a Uint8Array.
 * @param base64 - The base64 string (no metadata)
 * @returns A Uint8Array representing the decoded binary data.
 */
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Utility class to parse a base64 Data URL and extract file information.
 */
export class Base64String {
  public data: IBase64Data;

  private _b64: string;

  /**
   * Constructs a Base64String instance from a base64 Data URL.
   * @param base64String - A valid base64 Data URL, e.g. `data:image/png;name=file.png;base64,...`
   */
  constructor(base64String: string) {
    this._b64 = base64String;
    this.data = this._destructure();
  }

  /**
   * Parses the base64 string into its components: mimeType, filename, extension, and base64 data.
   * @returns The extracted base64 data object.
   * @throws If the base64 string format is invalid.
   */
  private _destructure(): IBase64Data {
    const regex = /data:(.*?);(?:.*;)*name=(.*?)\.(.*?);(?:.*;)*base64,(.*)/;
    const groups = regex.exec(this._b64);
    if (!groups || groups.length !== 5) {
      throw new Error(
        'Invalid base64 format. Ensure it includes name and base64 parts.'
      );
    }

    const [, mimeType, filename, extension, b64data] = groups;

    return {
      mimeType,
      filename: decodeURIComponent(filename),
      extension,
      b64data,
    };
  }

  /**
   * Gets the file buffer (binary data) as a Uint8Array.
   */
  public getBuffer(): Uint8Array {
    return base64ToArrayBuffer(this.data.b64data);
  }

  /**
   * Gets the file content as a Blob object.
   */
  public getBlob(): Blob {
    return new Blob([this.getBuffer()], { type: this.data.mimeType });
  }

  /**
   * Gets the full file name with extension.
   */
  public getFileNameWithExtension(): string {
    return `${this.data.filename}.${this.data.extension}`;
  }

  /**
   * Gets the file as a `File` object (e.g. for uploading or download).
   */
  public getFile(): File {
    return new File([this.getBlob()], this.getFileNameWithExtension(), {
      type: this.data.mimeType,
    });
  }
}
