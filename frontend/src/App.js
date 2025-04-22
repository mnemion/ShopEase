import React from 'react';
import { useAuth } from './context/AuthContext';
import Routes from './Routes';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Loading from './components/ui/Loading';

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Routes />
      </main>
      <Footer />
    </div>
  );
}

export default App;