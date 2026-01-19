declare module "piexifjs" {
  interface ExifIFD {
    [key: number]: number;
  }

  interface GPSIFD {
    GPSVersionID: number;
    GPSLatitudeRef: number;
    GPSLatitude: number;
    GPSLongitudeRef: number;
    GPSLongitude: number;
    GPSAltitudeRef: number;
    GPSAltitude: number;
    [key: number]: number;
  }

  interface ImageIFD {
    ImageDescription: number;
    Make: number;
    Model: number;
    Orientation: number;
    XResolution: number;
    YResolution: number;
    ResolutionUnit: number;
    Software: number;
    DateTime: number;
    [key: number]: number;
  }

  interface ExifData {
    "0th": Record<number, unknown>;
    "Exif": Record<number, unknown>;
    "GPS": Record<number, unknown>;
    "1st": Record<number, unknown>;
    "thumbnail": string | null;
  }

  const piexif: {
    load: (dataUrl: string) => ExifData;
    dump: (exifData: ExifData) => string;
    insert: (exifBytes: string, dataUrl: string) => string;
    remove: (dataUrl: string) => string;
    GPSIFD: GPSIFD;
    ImageIFD: ImageIFD;
    ExifIFD: ExifIFD;
  };

  export = piexif;
}
