export interface ServerLocation {
  name: string;
  countryCode: string; // 2-letter ISO code
  ips: string[];
  port: number;
  serverPublicKey: string;
}