/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LayoutShell } from './components/LayoutShell';
import {
  LoginScreen,
  OnboardingScreen,
  RegisterScreen,
  RoleSelectionScreen,
  SplashScreen,
} from './screens/AuthScreens';
import { CustomerHome } from './screens/CustomerHome';
import {
  AIDiagnosisScreen,
  DiagnosisResultsScreen,
  ImageUploadScreen,
} from './screens/DiagnosisFlow';
import {
  NearbyTechniciansScreen,
  TechnicianProfileScreen,
} from './screens/TechnicianDiscovery';
import { BookingScreen, RepairQuotationScreen } from './screens/QuotationBooking';
import { PaymentScreen, RepairTrackingScreen } from './screens/TrackingPayment';
import {
  DigitalWarrantyScreen,
  RecyclingScreen,
  RepairHistoryScreen,
} from './screens/HistoryWarrantyRecycle';
import { ProfileScreen } from './screens/ProfileScreen';
import { TechnicianDashboard } from './screens/TechnicianDashboard';
import { AdminDashboard } from './screens/AdminDashboard';

const ScreenRouter: React.FC = () => {
  const { screen, user, initializing } = useApp();

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#0B132B] text-white flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="font-display text-2xl font-bold tracking-tight">RepairSaathi</p>
          <p className="text-sm text-slate-300">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (screen === 'splash') return <SplashScreen />;
  if (screen === 'onboarding') return <OnboardingScreen />;
  if (screen === 'login') return <LoginScreen />;
  if (screen === 'register') return <RegisterScreen />;

  if (!user && screen !== 'role-select') {
    return <LoginScreen />;
  }

  return (
    <LayoutShell>
      {screen === 'role-select' && <RoleSelectionScreen />}
      {screen === 'customer-home' && <CustomerHome />}
      {screen === 'ai-diagnosis' && <AIDiagnosisScreen />}
      {screen === 'image-upload' && <ImageUploadScreen />}
      {screen === 'diagnosis-results' && <DiagnosisResultsScreen />}
      {screen === 'nearby-techs' && <NearbyTechniciansScreen />}
      {screen === 'tech-profile' && <TechnicianProfileScreen />}
      {screen === 'quotations' && <RepairQuotationScreen />}
      {screen === 'booking' && <BookingScreen />}
      {screen === 'tracking' && <RepairTrackingScreen />}
      {screen === 'payment' && <PaymentScreen />}
      {screen === 'history' && <RepairHistoryScreen />}
      {screen === 'warranty' && <DigitalWarrantyScreen />}
      {screen === 'recycling' && <RecyclingScreen />}
      {screen === 'profile' && <ProfileScreen />}
      {screen === 'tech-dashboard' && <TechnicianDashboard />}
      {screen === 'admin-dashboard' && <AdminDashboard />}
    </LayoutShell>
  );
};

export default function App() {
  return (
    <AppProvider>
      <ScreenRouter />
    </AppProvider>
  );
}
