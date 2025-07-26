
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { INITIAL_LOCATIONS, DNS_PRESETS } from './constants';
import type { ServerLocation } from './types';

// Declare nacl for TypeScript since it's loaded from a script tag
declare const nacl: any;

// Helper function to encode Uint8Array to Base64
const toBase64 = (bytes: Uint8Array): string => btoa(String.fromCharCode.apply(null, Array.from(bytes)));

// Icons
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-11.667-11.667a8.25 8.25 0 0 1 11.667 0l3.181 3.183m-14.85-3.183L6.336 6.336" />
    </svg>
);

const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const TelegramIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M9.78,18.65l.28-4.23l7.68-6.92c.34-.31-.07-.46-.52-.19L7.74,13.3L3.64,12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.28,1.28.2,1.03.94l-2.5,12.06c-.22.84-.74,1.04-1.4.63l-4.32-3.15l-2.1,2.02c-.2.2-.37.37-.73.37L9.78,18.65z"></path>
    </svg>
);


// Custom hook to detect clicks outside an element
const useOutsideClick = (ref: React.RefObject<HTMLElement>, callback: () => void) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback]);
};

const App: React.FC = () => {
    // App view state
    const [view, setView] = useState<'main' | 'edit_ips'>('main');

    // Main state
    const [locations, setLocations] = useState<ServerLocation[]>(() => {
        try {
            const saved = localStorage.getItem('wireguard-locations');
            return saved ? JSON.parse(saved) : INITIAL_LOCATIONS;
        } catch (error) {
            console.error("Failed to parse locations from localStorage", error);
            return INITIAL_LOCATIONS;
        }
    });
    const [configName, setConfigName] = useState('My-WireGuard-Config');
    const [clientPrivateKey, setClientPrivateKey] = useState('');
    const [clientPublicKey, setClientPublicKey] = useState('');
    const [presharedKey, setPresharedKey] = useState('');
    const [selectedLocation, setSelectedLocation] = useState<ServerLocation>(locations[0]);
    const [isGodMode, setIsGodMode] = useState(false);
    
    // God Mode State
    const [interfaceIpv4, setInterfaceIpv4] = useState('10.8.0.2/24');
    const [interfaceIpv6, setInterfaceIpv6] = useState('fddd:2c4:2c4:2c4::2/64');
    const [dnsServers, setDnsServers] = useState('1.1.1.1, 1.0.0.1');
    const [allowedIPs, setAllowedIPs] = useState('0.0.0.0/0, ::/0');
    const [mtu, setMtu] = useState('1420');
    const [isKeepaliveEnabled, setIsKeepaliveEnabled] = useState(true);
    const [persistentKeepalive, setPersistentKeepalive] = useState('25');
    const [endpointIp, setEndpointIp] = useState('');
    const [endpointPort, setEndpointPort] = useState(locations[0].port);
    const [peerPublicKey, setPeerPublicKey] = useState(locations[0].serverPublicKey);
    const [generatedServerPrivateKey, setGeneratedServerPrivateKey] = useState('');


    // IP Editor State
    const [editingIpList, setEditingIpList] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // UI state
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    useOutsideClick(dropdownRef, () => setIsDropdownOpen(false));
    
    // Persist locations to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('wireguard-locations', JSON.stringify(locations));
        } catch (error) {
            console.error("Failed to save locations to localStorage", error);
        }
    }, [locations]);

    const handleGenerateKeys = useCallback(() => {
        if (typeof nacl === 'undefined') {
            console.error('tweetnacl not loaded');
            return;
        }
        const clientKeyPair = nacl.box.keyPair();
        setClientPrivateKey(toBase64(clientKeyPair.secretKey));
        setClientPublicKey(toBase64(clientKeyPair.publicKey));

        const newPresharedKey = nacl.randomBytes(32);
        setPresharedKey(toBase64(newPresharedKey));
    }, []);

    useEffect(() => {
        handleGenerateKeys();
    }, [handleGenerateKeys]);

    useEffect(() => {
        if (selectedLocation) {
            if (selectedLocation.ips.length > 0) {
                const randomIp = selectedLocation.ips[Math.floor(Math.random() * selectedLocation.ips.length)];
                setEndpointIp(randomIp);
            } else {
                setEndpointIp('ENTER_IP_IN_GOD_MODE');
            }
            setEndpointPort(selectedLocation.port);
            setPeerPublicKey(selectedLocation.serverPublicKey);
            setGeneratedServerPrivateKey(''); // Clear previously generated server private key
        }
    }, [selectedLocation]);

    const handleGeneratePeerKeys = () => {
        if (typeof nacl === 'undefined') {
            console.error('tweetnacl not loaded');
            return;
        }
        const serverKeyPair = nacl.box.keyPair();
        setPeerPublicKey(toBase64(serverKeyPair.publicKey));
        setGeneratedServerPrivateKey(toBase64(serverKeyPair.secretKey));
    };

    const handleGenerateRandomName = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let randomStr = '';
        for (let i = 0; i < 6; i++) {
            randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setConfigName(`Empress_${randomStr}`);
    };

    const handleDownload = () => {
        if (!clientPrivateKey || !selectedLocation) {
            alert('Please generate keys and select a location first.');
            return;
        }

        const interfaceAddresses = [interfaceIpv4, interfaceIpv6].filter(Boolean).join(', ');

        const interfaceSection = [
            '[Interface]',
            `PrivateKey = ${clientPrivateKey}`
        ];
        if (interfaceAddresses) interfaceSection.push(`Address = ${interfaceAddresses}`);
        if (dnsServers) interfaceSection.push(`DNS = ${dnsServers}`);
        if (mtu) interfaceSection.push(`MTU = ${mtu}`);

        const peerSection = [
            '[Peer]',
            `PublicKey = ${peerPublicKey}`
        ];
        if (presharedKey) peerSection.push(`PresharedKey = ${presharedKey}`);
        if (endpointIp && endpointPort) peerSection.push(`Endpoint = ${endpointIp}:${endpointPort}`);
        if (allowedIPs) peerSection.push(`AllowedIPs = ${allowedIPs}`);
        if (isKeepaliveEnabled && persistentKeepalive && parseInt(persistentKeepalive, 10) > 0) {
            peerSection.push(`PersistentKeepalive = ${persistentKeepalive}`);
        }
        
        const config = `${interfaceSection.join('\n')}\n\n${peerSection.join('\n')}`.trim();

        const blob = new Blob([config], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${configName.replace(/\s+/g, '-')}.conf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleLocationSelect = (location: ServerLocation) => {
        setSelectedLocation(location);
        setIsDropdownOpen(false);
    };

    const handleEditIps = () => {
        setEditingIpList(selectedLocation.ips.join('\n'));
        setView('edit_ips');
    };

    const handleSaveIps = () => {
        const newIps = editingIpList.split('\n').map(ip => ip.trim()).filter(ip => ip.length > 0);
        const newLocations = locations.map(loc => {
            if (loc.name === selectedLocation.name) {
                return { ...loc, ips: newIps };
            }
            return loc;
        });
        setLocations(newLocations);
        const updatedSelectedLocation = newLocations.find(l => l.name === selectedLocation.name);
        if(updatedSelectedLocation) setSelectedLocation(updatedSelectedLocation);

        setView('main');
    };
    
    const handleBackup = () => {
        const jsonString = JSON.stringify(locations, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wireguard-ips-backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File could not be read");
                const parsedLocations = JSON.parse(text);
                if (Array.isArray(parsedLocations) && parsedLocations.every(loc => loc.name && loc.countryCode && Array.isArray(loc.ips))) {
                    setLocations(parsedLocations);
                    alert('IP list restored successfully!');
                    setView('main');
                } else {
                    throw new Error("Invalid file format");
                }
            } catch (error) {
                console.error("Failed to restore from file", error);
                alert("Failed to restore. Please make sure it's a valid backup file.");
            }
        };
        reader.readAsText(file);
        // Reset file input value to allow re-uploading the same file
        event.target.value = '';
    };

    const godModeButtonClasses = isGodMode
        ? 'flex items-center gap-2 px-4 py-2 rounded-none text-sm font-bold transition-all duration-200 bg-brand-blue text-white border-2 border-black'
        : 'flex items-center gap-2 px-4 py-2 rounded-none text-sm font-semibold transition-all duration-200 border border-dashed border-neutral-600 text-neutral-400 hover:border-solid hover:border-neutral-400 hover:text-neutral-300';
    
    const inputClasses = "w-full bg-neutral-800 border border-neutral-600 rounded-none px-4 py-2 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-0 focus:border-2 focus:border-brand-blue transition-colors";
    const godModeInputClasses = `${inputClasses} font-mono text-sm`;
    const labelClasses = "block text-sm font-medium text-neutral-300 mb-2";
    const baseButtonClasses = "w-full flex items-center justify-center gap-3 font-bold py-3 px-4 rounded-none border-2 border-black transition-all duration-200";
    const primaryButtonClasses = `${baseButtonClasses} bg-brand-blue text-white shadow-[4px_4px_0px_#000] hover:brightness-95 active:shadow-none active:translate-x-1 active:translate-y-1 disabled:bg-neutral-600 disabled:text-neutral-400 disabled:shadow-none disabled:border-neutral-700 disabled:cursor-not-allowed`;
    const secondaryButtonClasses = `${baseButtonClasses} bg-neutral-700 text-neutral-100 shadow-[4px_4px_0px_#000] hover:bg-neutral-600 active:shadow-none active:translate-x-1 active:translate-y-1`;

    if (view === 'edit_ips') {
        return (
            <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans">
                 <main className="max-w-2xl mx-auto p-4 sm:p-8 flex flex-col items-center justify-center min-h-screen">
                    <header className="text-center mb-10">
                         <h1 className="text-3xl sm:text-4xl font-black text-brand-blue">
                            Manage Endpoints
                        </h1>
                        <p className="mt-2 text-lg text-neutral-400">
                            Editing IPs for <span className="font-bold text-neutral-200">{selectedLocation.name}</span>
                        </p>
                    </header>
                    <div className="w-full bg-neutral-900 border-2 border-neutral-700 rounded-none p-6 sm:p-8 space-y-6">
                         <div>
                            <label htmlFor="ip-list" className={labelClasses}>
                                Endpoint IP Addresses (one per line)
                            </label>
                            <textarea
                                id="ip-list"
                                value={editingIpList}
                                onChange={e => setEditingIpList(e.target.value)}
                                className={`${inputClasses} font-mono h-48`}
                                placeholder="8.8.8.8&#10;1.1.1.1"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-neutral-800">
                            <button onClick={handleSaveIps} className={primaryButtonClasses}>
                                Save IPs
                            </button>
                            <button onClick={() => setView('main')} className={secondaryButtonClasses}>
                                Cancel
                            </button>
                        </div>
                        <div className="space-y-4 pt-4 border-t border-neutral-800">
                            <h3 className="text-lg font-bold text-center text-neutral-400">Database</h3>
                             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
                             <div className="flex flex-col sm:flex-row gap-4">
                               <button onClick={handleRestoreClick} className={secondaryButtonClasses}>
                                   Restore from JSON
                               </button>
                               <button onClick={handleBackup} className={secondaryButtonClasses}>
                                   Backup to JSON
                               </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        )
    }


    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans">
            <main className="max-w-2xl mx-auto p-4 sm:p-8 flex flex-col items-center justify-center min-h-screen">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-black text-brand-blue">
                        WireGuard Configurator
                    </h1>
                    <p className="mt-4 text-lg text-neutral-400">
                        A brutalist interface for modern privacy.
                    </p>
                </header>

                <div className="w-full bg-neutral-900 border-2 border-neutral-700 rounded-none p-6 sm:p-8 space-y-6">
                    {/* Config Name */}
                    <div>
                        <label htmlFor="configName" className={labelClasses}>Configuration Name</label>
                        <div className="flex items-center gap-2">
                             <input
                                type="text"
                                id="configName"
                                value={configName}
                                onChange={(e) => setConfigName(e.target.value)}
                                className="flex-grow bg-neutral-800 border border-neutral-600 rounded-none px-4 py-2 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-0 focus:border-2 focus:border-brand-blue transition-colors"
                                placeholder="e.g., Empress_a1B2c3"
                            />
                            <button onClick={handleGenerateRandomName} title="Generate random name" className="p-2 bg-neutral-800 rounded-none border border-neutral-600 hover:bg-neutral-700 transition-colors h-full aspect-square flex items-center justify-center">
                                <SparklesIcon className="w-5 h-5 text-neutral-400" />
                            </button>
                        </div>
                    </div>

                    {/* Location Selector */}
                    <div>
                        <label className={labelClasses}>Server Location</label>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-grow" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full flex items-center justify-between bg-neutral-800 border border-neutral-600 rounded-none px-4 py-2 text-left focus:outline-none focus:ring-0 focus:border-2 focus:border-brand-blue transition-colors"
                                >
                                    <span className="flex items-center gap-3">
                                        <img src={`https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/7.2.1/flags/4x3/${selectedLocation.countryCode}.svg`} alt={`${selectedLocation.name} flag`} className="w-6 h-auto" />
                                        <span>{selectedLocation.name}</span>
                                    </span>
                                    <ChevronDownIcon className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isDropdownOpen && (
                                    <div className="absolute mt-1 w-full bg-neutral-900 border border-neutral-600 rounded-none shadow-lg z-10 max-h-60 overflow-y-auto">
                                        {locations.map(location => (
                                            <div
                                                key={location.name}
                                                onClick={() => handleLocationSelect(location)}
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-brand-blue hover:text-black cursor-pointer transition-colors"
                                            >
                                                <img src={`https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/7.2.1/flags/4x3/${location.countryCode}.svg`} alt={`${location.name} flag`} className="w-6 h-auto" />
                                                <span>{location.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button onClick={handleEditIps} title="Manage endpoint IPs" className="p-2 bg-neutral-800 rounded-none border border-neutral-600 hover:bg-neutral-700 transition-colors h-full aspect-square flex items-center justify-center"><EditIcon className="w-5 h-5" /></button>
                        </div>
                    </div>
                    
                    {/* Public Key Display */}
                    <div>
                        <label className={labelClasses}>Your Public Key</label>
                        <div className="flex items-center gap-2">
                             <input
                                type="text"
                                readOnly
                                value={clientPublicKey}
                                className="w-full bg-neutral-800 border border-neutral-600 rounded-none px-4 py-2 text-neutral-400 font-mono text-sm truncate"
                                aria-label="Client Public Key"
                             />
                             <button onClick={handleGenerateKeys} title="Generate new keys" className="p-2 bg-neutral-800 rounded-none border border-neutral-600 hover:bg-neutral-700 transition-colors"><RefreshIcon className="w-5 h-5" /></button>
                        </div>
                    </div>

                    {/* God Mode */}
                    <div className="pt-4 border-t border-neutral-800">
                        <div className="flex justify-center items-center">
                             <button
                                onClick={() => setIsGodMode(!isGodMode)}
                                className={godModeButtonClasses}
                            >
                                <SparklesIcon className={`w-5 h-5 transition-colors ${isGodMode ? 'text-white' : 'text-neutral-500'}`} />
                                GOD MODE {isGodMode ? 'ACTIVATED' : 'DISABLED'}
                            </button>
                        </div>
                    </div>

                    {isGodMode && (
                        <div className="space-y-6 pt-4 border-t border-brand-blue/30">
                            <h3 className="text-lg font-bold text-center text-brand-blue">Advanced Configuration</h3>
                            
                            <div className="space-y-4 p-4 border border-neutral-700 rounded-none">
                                <h4 className="font-bold text-neutral-300">Interface Settings</h4>
                                <div>
                                    <label htmlFor="ipv4_address" className={labelClasses}>Interface IPv4 Address</label>
                                    <input id="ipv4_address" value={interfaceIpv4} onChange={e => setInterfaceIpv4(e.target.value)} className={godModeInputClasses} placeholder="e.g., 10.8.0.2/24" />
                                </div>
                                <div>
                                    <label htmlFor="ipv6_address" className={labelClasses}>Interface IPv6 Address</label>
                                    <input id="ipv6_address" value={interfaceIpv6} onChange={e => setInterfaceIpv6(e.target.value)} className={godModeInputClasses} placeholder="e.g., fddd:2c4::2/64" />
                                </div>
                                <div>
                                    <label htmlFor="dns" className={labelClasses}>DNS Servers</label>
                                    <input id="dns" value={dnsServers} onChange={e => setDnsServers(e.target.value)} className={godModeInputClasses} />
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {Object.entries(DNS_PRESETS).map(([name, ips]) => (
                                            <button key={name} onClick={() => setDnsServers(ips)} className="px-2 py-1 text-xs bg-neutral-700 text-neutral-300 rounded-none border border-neutral-600 hover:bg-neutral-600 transition-colors">
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                 <div>
                                    <label htmlFor="mtu" className={labelClasses}>MTU</label>
                                    <input id="mtu" value={mtu} onChange={e => setMtu(e.target.value)} className={godModeInputClasses} placeholder="e.g., 1420" />
                                </div>
                            </div>

                            <div className="space-y-4 p-4 border border-neutral-700 rounded-none">
                                <h4 className="font-bold text-neutral-300">Peer Settings</h4>
                                <div>
                                    <label htmlFor="peer_public_key" className={labelClasses}>Server Public Key</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="peer_public_key"
                                            value={peerPublicKey}
                                            onChange={e => {
                                                setPeerPublicKey(e.target.value);
                                                // If user manually edits the key, the generated private key is no longer valid for it.
                                                if (generatedServerPrivateKey) {
                                                    setGeneratedServerPrivateKey('');
                                                }
                                            }}
                                            className={godModeInputClasses}
                                        />
                                        <button onClick={handleGeneratePeerKeys} title="Generate new server keypair" className="p-2 bg-neutral-800 rounded-none border border-neutral-600 hover:bg-neutral-700 transition-colors"><RefreshIcon className="w-5 h-5" /></button>
                                    </div>
                                    {generatedServerPrivateKey && (
                                        <div className="mt-2 p-3 bg-neutral-950 border border-amber-500/50 rounded-none">
                                            <p className="text-xs text-amber-400 font-semibold mb-1">Save this key! This is your server's private key.</p>
                                            <p className="font-mono text-xs text-neutral-400 break-all">{generatedServerPrivateKey}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <div className="sm:col-span-2">
                                    <label htmlFor="endpoint_ip" className={labelClasses}>Endpoint IP</label>
                                    <input id="endpoint_ip" value={endpointIp} onChange={e => setEndpointIp(e.target.value)} className={godModeInputClasses} />
                                  </div>
                                   <div>
                                    <label htmlFor="endpoint_port" className={labelClasses}>Port</label>
                                    <input id="endpoint_port" type="number" value={endpointPort} onChange={e => setEndpointPort(Number(e.target.value))} className={godModeInputClasses} />
                                  </div>
                                </div>
                                <div>
                                    <label htmlFor="allowed_ips" className={labelClasses}>Allowed IPs</label>
                                    <input id="allowed_ips" value={allowedIPs} onChange={e => setAllowedIPs(e.target.value)} className={godModeInputClasses} />
                                </div>
                                <div>
                                    <div className='flex items-center justify-between mb-2'>
                                        <label htmlFor="persistent_keepalive" className={labelClasses + ' mb-0'}>Persistent Keepalive</label>
                                        <button onClick={() => setIsKeepaliveEnabled(!isKeepaliveEnabled)} className={`px-3 py-1 text-xs rounded-full font-bold transition-colors ${isKeepaliveEnabled ? 'bg-brand-blue text-white' : 'bg-neutral-700 text-neutral-300'}`}>
                                            {isKeepaliveEnabled ? 'Enabled' : 'Disabled'}
                                        </button>
                                    </div>
                                    {isKeepaliveEnabled && (
                                      <input id="persistent_keepalive" value={persistentKeepalive} onChange={e => setPersistentKeepalive(e.target.value)} className={godModeInputClasses} placeholder="e.g., 25 (seconds)" />
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="preshared_key" className={labelClasses}>Preshared Key</label>
                                    <input id="preshared_key" value={presharedKey} onChange={e => setPresharedKey(e.target.value)} className={godModeInputClasses} />
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Download Button */}
                    <div className="pt-4">
                        <button
                            onClick={handleDownload}
                            className={primaryButtonClasses}
                            disabled={!clientPrivateKey}
                        >
                            <DownloadIcon className="w-6 h-6" />
                            Download Configuration
                        </button>
                    </div>
                </div>

                <footer className="text-center py-8 mt-8 space-y-4">
                  <p className="text-neutral-500 text-sm">Make by Empree Team support us!</p>
                  <a
                      href="https://t.me/Empress_team"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded-none border-2 border-black bg-[#2AABEE] text-white shadow-[4px_4px_0px_#000] hover:brightness-95 active:shadow-none active:translate-x-1 active:translate-y-1 transition-all duration-200"
                  >
                      <TelegramIcon className="w-5 h-5" />
                      Join Telegram
                  </a>
                </footer>
            </main>
        </div>
    );
};

export default App;
