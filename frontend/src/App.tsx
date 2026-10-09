import { useState } from 'react';
import { SecureStorage } from '@/utils/storage';
import { Sidebar, type Page } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { DashboardPage } from '@/pages/DashboardPage';
import { HallsPage } from '@/pages/HallsPage';
import { SeatDesignerPage } from '@/pages/SeatDesignerPage';
import { EventsPage } from '@/pages/EventsPage';
import { AttendeesPage } from '@/pages/AttendeesPage';
import { AssignmentPage } from '@/pages/AssignmentPage';
import { PresentationPage } from '@/pages/PresentationPage';
import { PrintPage } from '@/pages/PrintPage';
import { LoginPage } from '@/pages/LoginPage';
import { UsersPage } from '@/pages/UsersPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!SecureStorage.getItem('token'));
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [designerHallId, setDesignerHallId] = useState<string | null>(null);

  const handleLoginSuccess = (token: string, user: any) => {
    SecureStorage.setItem('token', token);
    if (user && user.roles) {
      SecureStorage.setItem('userRoles', user.roles);
    }
    if (user && user.permissions) {
      SecureStorage.setItem('userPermissions', user.permissions);
    }
    if (user) {
      SecureStorage.setItem('userInfo', {
        fullName: user.fullName,
        username: user.username,
        email: user.email
      });
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    SecureStorage.removeItem('token');
    SecureStorage.removeItem('userRoles');
    SecureStorage.removeItem('userPermissions');
    SecureStorage.removeItem('userInfo');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const handleNavigate = (page: Page) => {
    if (page !== 'designer') {
      setDesignerHallId(null);
    }
    setCurrentPage(page);
  };

  const handleOpenDesigner = (hallId: string) => {
    setDesignerHallId(hallId);
    setCurrentPage('designer');
  };

  const handleBackFromDesigner = () => {
    setDesignerHallId(null);
    setCurrentPage('halls');
  };

  let userInfo = null;
  try {
    const storedInfo = SecureStorage.getItem<any>('userInfo');
    if (storedInfo) {
      userInfo = storedInfo;
    }
  } catch (e) {
    console.error('Failed to parse user info', e);
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={handleNavigate} 
        onLogout={handleLogout}
        userInfo={userInfo}
        userPermissions={SecureStorage.getItem<string[]>('userPermissions') || []}
        userRoles={SecureStorage.getItem<string[]>('userRoles') || []}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar 
          currentPage={currentPage}
          userInfo={userInfo} 
          onLogout={handleLogout} 
          userRoles={SecureStorage.getItem<string[]>('userRoles') || []}
        />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 w-full flex flex-col">
          {currentPage === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
          {currentPage === 'halls' && <HallsPage onOpenDesigner={handleOpenDesigner} />}
          {currentPage === 'designer' && designerHallId && (
            <SeatDesignerPage hallId={designerHallId} onBack={handleBackFromDesigner} />
          )}
          {currentPage === 'designer' && !designerHallId && (
            <HallsPage onOpenDesigner={handleOpenDesigner} />
          )}
          {currentPage === 'events' && <EventsPage />}
          {currentPage === 'attendees' && <AttendeesPage />}
          {currentPage === 'assignment' && <AssignmentPage />}
          {currentPage === 'presentation' && <PresentationPage />}
          {currentPage === 'print' && <PrintPage />}
          {currentPage === 'accounts' && <UsersPage />}
        </main>
      </div>
    </div>
  );
}

export default App;
