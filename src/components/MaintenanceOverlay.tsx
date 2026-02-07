import React, { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const MaintenanceOverlay = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [lastCheck, setLastCheck] = useState<Date | null>(null);

    const handleMaintenance = useCallback(() => {
        console.log('[MaintenanceOverlay] Maintenance mode detected');
        setIsVisible(true);
        setLastCheck(new Date());
    }, []);

    const handleDismiss = useCallback(() => {
        console.log('[MaintenanceOverlay] Dismissing overlay');
        setIsVisible(false);
    }, []);

    const handleRetry = useCallback(async () => {
        console.log('[MaintenanceOverlay] Retrying connection...');
        setLastCheck(new Date());

        // Try to ping the health endpoint to see if maintenance is over
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://symone-gateway-583316903827.us-central1.run.app';
            const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });

            if (response.ok && response.status !== 503) {
                console.log('[MaintenanceOverlay] Service is back online');
                setIsVisible(false);
                // Reload the page to refresh data
                window.location.reload();
            } else {
                console.log('[MaintenanceOverlay] Still in maintenance mode');
            }
        } catch (error) {
            console.log('[MaintenanceOverlay] Health check failed:', error);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('maintenance_mode_active', handleMaintenance);

        return () => window.removeEventListener('maintenance_mode_active', handleMaintenance);
    }, [handleMaintenance]);

    // Check on mount if we should show (in case page was refreshed during maintenance)
    useEffect(() => {
        const checkMaintenanceOnLoad = async () => {
            try {
                const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://symone-gateway-583316903827.us-central1.run.app';
                const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });

                if (response.status === 503) {
                    setIsVisible(true);
                    setLastCheck(new Date());
                }
            } catch (error) {
                // Health check failed, could be network or maintenance
                console.log('[MaintenanceOverlay] Initial health check failed');
            }
        };

        checkMaintenanceOnLoad();
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
            <div className="max-w-md w-full mx-4 p-8 text-center space-y-6 bg-card border rounded-lg shadow-lg animate-in fade-in zoom-in duration-300">
                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
                    aria-label="Dismiss"
                >
                    <X className="w-5 h-5 text-muted-foreground" />
                </button>

                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center dark:bg-yellow-900/30">
                    <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">System Maintenance</h2>
                    <p className="text-muted-foreground">
                        Symone is currently undergoing scheduled maintenance.
                        We'll be back shortly.
                    </p>
                </div>

                {lastCheck && (
                    <div className="text-xs text-muted-foreground">
                        Last checked: {lastCheck.toLocaleTimeString()}
                    </div>
                )}

                <div className="flex gap-3 justify-center pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={handleDismiss}
                        className="flex items-center gap-2"
                    >
                        <X className="w-4 h-4" />
                        Dismiss
                    </Button>
                    <Button
                        onClick={handleRetry}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry Connection
                    </Button>
                </div>

                <div className="text-sm text-muted-foreground pt-2">
                    <p>Status: Service Unavailable (503)</p>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceOverlay;
