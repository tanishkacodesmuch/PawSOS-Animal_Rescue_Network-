/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RescueProvider, useRescue } from './context/RescueContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ToastContainer } from './components/common/ToastContainer';
import { FloatingEmergencySOS } from './components/common/FloatingEmergencySOS';

// Pages
import { LandingPage } from './pages/LandingPage';
import { ReportEmergencyPage } from './pages/ReportEmergencyPage';
import { TrackRescuePage } from './pages/TrackRescuePage';
import { CitizenDashboard } from './pages/dashboards/CitizenDashboard';
import { ResponderDashboard } from './pages/dashboards/ResponderDashboard';
import { ShelterDashboard } from './pages/dashboards/ShelterDashboard';
import { VetDashboard } from './pages/dashboards/VetDashboard';
import { AdminDashboard } from './pages/dashboards/AdminDashboard';
import { RescueNetworkPage } from './pages/RescueNetworkPage';
import { SupportPage } from './pages/SupportPage';
import { ImpactPage } from './pages/ImpactPage';
import { AuthPage } from './pages/AuthPage';

const AppContent: React.FC = () => {
  const { currentRoute } = useRescue();

  const renderCurrentPage = () => {
    const route = currentRoute.split('?')[0];

    switch (route) {
      case '/report':
        return <ReportEmergencyPage />;
      case '/track':
        return <TrackRescuePage />;
      case '/citizen/dashboard':
        return <CitizenDashboard />;
      case '/responder/dashboard':
        return <ResponderDashboard />;
      case '/partner/dashboard':
        return <ShelterDashboard />;
      case '/vet/dashboard':
        return <VetDashboard />;
      case '/admin/dashboard':
        return <AdminDashboard />;
      case '/network':
        return <RescueNetworkPage />;
      case '/support':
        return <SupportPage />;
      case '/impact':
        return <ImpactPage />;
      case '/login':
        return <AuthPage initialMode="login" />;
      case '/register':
        return <AuthPage initialMode="register" />;
      case '/':
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF7] text-[#172B26]">
      <Navbar />
      <main className="flex-1">
        {renderCurrentPage()}
      </main>
      <Footer />
      <FloatingEmergencySOS />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <RescueProvider>
      <AppContent />
    </RescueProvider>
  );
}
