
import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export const MaintenanceOverlay = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleMaintenance = () => setIsVisible(true);
        window.addEventListener('maintenance_mode_active', handleMaintenance);

        // Also check if we already have a flag in sessionStorage (optional, but good for refresh)
        // But 503 will trigger it again immediately on first API call.

        return () => window.removeEventListener('maintenance_mode_active', handleMaintenance);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
            <div className="max-w-md p-8 text-center space-y-6 bg-card border rounded-lg shadow-lg animate-in fade-in zoom-in duration-300">
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
                <div className="text-sm text-muted-foreground pt-4 border-t">
                    <p>Status: Unavailable (503)</p>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceOverlay;
