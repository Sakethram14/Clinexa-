
import React, { useState, useEffect } from 'react';
import { Page, PatientIntake as PatientIntakeType } from './types';
import Layout from './components/Layout';
import PatientIntake from './pages/PatientIntake';
import DoctorDashboard from './pages/DoctorDashboard';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.INTAKE);
  const [intakes, setIntakes] = useState<PatientIntakeType[]>([]);

  // Load from local storage for demo purposes
  useEffect(() => {
    const saved = localStorage.getItem('clinexa_intakes');
    if (saved) {
      try {
        setIntakes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved intakes");
      }
    }
  }, []);

  const handleSaveIntake = (newIntake: PatientIntakeType) => {
    const updated = [...intakes, newIntake];
    setIntakes(updated);
    localStorage.setItem('clinexa_intakes', JSON.stringify(updated));
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.INTAKE:
        return <PatientIntake onSave={handleSaveIntake} />;
      case Page.DASHBOARD:
        return <DoctorDashboard intakes={intakes} />;
      default:
        return <PatientIntake onSave={handleSaveIntake} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

export default App;
