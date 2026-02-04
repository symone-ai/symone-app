import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Docs from "./pages/Docs";
import Contact from "./pages/Contact";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Servers from "./pages/dashboard/Servers";
import Activity from "./pages/dashboard/Activity";
import Secrets from "./pages/dashboard/Secrets";
import Team from "./pages/dashboard/Team";
import Settings from "./pages/dashboard/Settings";
import Replay from "./pages/dashboard/Replay";
import Marketplace from "./pages/dashboard/Marketplace";
import DeployServer from "./pages/dashboard/DeployServer";
import ScheduledJobs from "./pages/dashboard/ScheduledJobs";
import NotFound from "./pages/NotFound";
import UserProtectedRoute from "./components/UserProtectedRoute";

const queryClient = new QueryClient();

const AppApp = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
                <Routes>
                    {/* Marketing pages */}
                    <Route path="/" element={<Index />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/docs" element={<Docs />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/login" element={<Login />} />

                    {/* Dashboard Routes */}
                    <Route element={<UserProtectedRoute />}>
                        <Route path="/dashboard" element={<DashboardLayout><Overview /></DashboardLayout>} />
                        <Route path="/dashboard/servers" element={<DashboardLayout><Servers /></DashboardLayout>} />
                        <Route path="/dashboard/servers/deploy" element={<DashboardLayout><DeployServer /></DashboardLayout>} />
                        <Route path="/dashboard/activity" element={<DashboardLayout><Activity /></DashboardLayout>} />
                        <Route path="/dashboard/secrets" element={<DashboardLayout><Secrets /></DashboardLayout>} />
                        <Route path="/dashboard/team" element={<DashboardLayout><Team /></DashboardLayout>} />
                        <Route path="/dashboard/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
                        <Route path="/dashboard/replay" element={<DashboardLayout><Replay /></DashboardLayout>} />
                        <Route path="/dashboard/marketplace" element={<DashboardLayout><Marketplace /></DashboardLayout>} />
                        <Route path="/dashboard/scheduled-jobs" element={<DashboardLayout><ScheduledJobs /></DashboardLayout>} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default AppApp;
