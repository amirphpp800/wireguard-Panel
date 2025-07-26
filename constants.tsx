
import type { ServerLocation } from './types';

// NOTE: These are example values. In a real application,
// this data would come from a secure backend service.
export const INITIAL_LOCATIONS: ServerLocation[] = [
  { name: 'Russia', countryCode: 'ru', ips: ['192.0.2.10', '198.51.100.10', '203.0.113.10'], port: 51820, serverPublicKey: 'aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3aB4c=' },
  { name: 'USA', countryCode: 'us', ips: ['192.0.2.11', '198.51.100.11', '203.0.113.11'], port: 51820, serverPublicKey: 'bC2dE3fG4hI5jK6lM7nO8pQ9rS0tU1vW2xY3zZ4aB5c=' },
  { name: 'Armenia', countryCode: 'am', ips: ['192.0.2.12', '198.51.100.12', '203.0.113.12'], port: 51820, serverPublicKey: 'cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV2wX3yZ4aB5c6dE=' },
  { name: 'Oman', countryCode: 'om', ips: ['192.0.2.13', '198.51.100.13', '203.0.113.13'], port: 51820, serverPublicKey: 'dE4fG5hI6jK7lM8nO9pQ0rS1tU2vW3xY4zZ5aB6c7dF=' },
  { name: 'Germany', countryCode: 'de', ips: ['192.0.2.14', '198.51.100.14', '203.0.113.14'], port: 51820, serverPublicKey: 'eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB6c7dG8hI=' },
  { name: 'China', countryCode: 'cn', ips: ['192.0.2.15', '198.51.100.15', '203.0.113.15'], port: 51820, serverPublicKey: 'fG6hI7jK8lM9nO0pQ1rS2tU3vW4xY5zZ6aB7c8dE9hJ=' },
  { name: 'UAE', countryCode: 'ae', ips: ['192.0.2.16', '198.51.100.16', '203.0.113.16'], port: 51820, serverPublicKey: 'gH7iJ8kL9mN0oP1qR2sT3uV4wX5yZ6aB7c8dF9hK0lM=' },
  { name: 'France', countryCode: 'fr', ips: ['192.0.2.17', '198.51.100.17', '203.0.113.17'], port: 51820, serverPublicKey: 'hI8jK9lM0nO1pQ2rS3tU4vW5xY6zZ7aB8c9dE0hL1mN=' },
  { name: 'Albania', countryCode: 'al', ips: ['192.0.2.18', '198.51.100.18', '203.0.113.18'], port: 51820, serverPublicKey: 'iJ9kL0mN1oP2qR3sT4uV5wX6yZ7aB8c9dF0hM1nO2pQ=' },
  { name: 'Belgium', countryCode: 'be', ips: ['192.0.2.19', '198.51.100.19', '203.0.113.19'], port: 51820, serverPublicKey: 'jK0lM1nO2pQ3rS4tU5vW6xY7zZ8aB9c0dE1hN2oP3qR=' },
  { name: 'Czech Republic', countryCode: 'cz', ips: ['192.0.2.20', '198.51.100.20', '203.0.113.20'], port: 51820, serverPublicKey: 'kL1mN2oP3qR4sT5uV6wX7yZ8aB9c0dF1hO2pQ3rS4tU=' },
  { name: 'Saudi Arabia', countryCode: 'sa', ips: ['192.0.2.21', '198.51.100.21', '203.0.113.21'], port: 51820, serverPublicKey: 'lM2nO3pQ4rS5tU6vW7xY8zZ9aB0c1dE2hP3qR4sT5uV=' },
];

export const DNS_PRESETS: Record<string, string> = {
  'Cloudflare': '1.1.1.1, 1.0.0.1',
  'Google': '8.8.8.8, 8.8.4.4',
  'Radar': '10.202.10.10, 10.202.10.11',
  'Electro': '78.157.42.100, 78.157.42.101',
  'OpenDNS': '208.67.222.222, 208.67.220.220',
  'Shekan': '178.22.122.100, 185.51.200.2',
  'Shekan Pro': '178.22.122.101, 185.51.200.1',
};

export const PREDEFINED_INTERFACE_ADDRESSES: Record<string, string[]> = {
  ipv4: [
    '10.10.10.2/24',
    '10.20.30.15/24',
    '192.168.1.100/24',
    '192.168.50.25/24',
    '172.16.5.10/24',
    '10.0.0.2/24',
    '192.168.100.10/24',
  ],
  ipv6: [
    'fd12:3456:789a:1::2/64',
    'fd00:abcd:1234:5678::2/64',
    'fd10:20ff:abcd::5/64',
    'fdff:0000:0000:0001::10/64',
    'fd99:8888:7777::3/64',
    'fd86:ea04:ffff::2/64',
  ],
};
